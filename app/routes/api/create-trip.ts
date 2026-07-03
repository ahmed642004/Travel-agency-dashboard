import { type ActionFunctionArgs, data } from "react-router";
import { parseMarkdownToJson } from "~/lib/utils";
import supabase from "~/supabase/supabase";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const body = await request.json();
    const {
      country,
      numberOfDays,
      travelStyle,
      interests,
      budget,
      groupType,
      userId,
    } = body ?? {};

    if (
      !country ||
      !numberOfDays ||
      !travelStyle ||
      !interests ||
      !budget ||
      !groupType ||
      !userId
    ) {
      return Response.json(
        { error: "Missing required fields for trip generation." },
        { status: 400 },
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    const unsplashApiKey = process.env.VITE_UNSPLASH_API_KEY;

    if (!groqApiKey || !unsplashApiKey) {
      return Response.json(
        { error: "Server API keys are not configured." },
        { status: 500 },
      );
    }

    const prompt = `Generate a ${numberOfDays}-day travel itinerary for ${country} based on the following user information:
    Budget: '${budget}'
    Interests: '${interests}'
    TravelStyle: '${travelStyle}'
    GroupType: '${groupType}'
    Return the itinerary and lowest estimated price in a clean, non-markdown JSON format with the following structure:
    {
      "name": "A descriptive title for the trip",
      "description": "A brief description of the trip and its highlights not exceeding 100 words",
      "estimatedPrice": "Lowest average price for the trip in USD, e.g.$price",
      "duration": ${numberOfDays},
      "budget": "${budget}",
      "travelStyle": "${travelStyle}",
      "country": "${country}",
      "interests": "${interests}",
      "groupType": "${groupType}",
      "rating": "Give me the global average rating for this trip/package across all major travel platforms and sources. Return the rating number only.",
      "bestTimeToVisit": [
        '🌸 Season (from month to month): reason to visit',
        '☀️ Season (from month to month): reason to visit',
        '🍁 Season (from month to month): reason to visit',
        '❄️ Season (from month to month): reason to visit'
      ],
      "weatherInfo": [
        '☀️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
        '🌦️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
        '🌧️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
        '❄️ Season: temperature range in Celsius (temperature range in Fahrenheit)'
      ],
      "location": {
        "city": "name of the city or region",
        "coordinates": [latitude, longitude],
        "openStreetMap": "link to open street map"
      },
      "itinerary": [
        {
          "day": 1,
          "location": "City/Region Name",
          "activities": [
            {"time": "Morning", "description": "🏰 Visit the local historic castle and enjoy a scenic walk"},
            {"time": "Afternoon", "description": "🖼️ Explore a famous art museum with a guided tour"},
            {"time": "Evening", "description": "🍷 Dine at a rooftop restaurant with local wine"}
          ]
        }
      ]
    }`;

    // 🔹 Generate trip data using Groq
    const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are a travel planner API. Return only one valid JSON object and no extra text.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const details = await aiResponse.text();
      return Response.json(
        { error: `Groq request failed: ${details || aiResponse.statusText}` },
        { status: aiResponse.status },
      );
    }

    const aiPayload = await aiResponse.json();
    const aiContent = aiPayload?.choices?.[0]?.message?.content;
    if (typeof aiContent !== "string" || !aiContent.trim()) {
      return Response.json(
        { error: "Groq did not return trip content." },
        { status: 502 },
      );
    }

    const directJson = (() => {
      try {
        return JSON.parse(aiContent);
      } catch {
        return null;
      }
    })();
    const trip = directJson ?? parseMarkdownToJson(aiContent);
    if (!trip) {
      return Response.json(
        { error: "Failed to parse generated trip content." },
        { status: 502 },
      );
    }

    // 🔹 Fetch trip images from Unsplash
    const imageResponse = await fetch(
      `https://api.unsplash.com/search/photos?query=${country} ${interests} ${travelStyle}&client_id=${unsplashApiKey}`,
    );

    const imagePayload = await imageResponse.json();
    const imageResults = Array.isArray(imagePayload?.results)
      ? imagePayload.results
      : [];
    const imageUrls = imageResults
      .slice(0, 3)
      .map((result: any) => result.urls?.regular || null);

    // 🔹 Insert trip into Supabase
    const { data: insertedTrip, error } = await supabase
      .from("trips")
      .insert([
        {
          tripDetail: JSON.stringify(trip),
          imageUrls,
          createdAt: new Date().toISOString(),
          userId,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return Response.json({ error: "Failed to save generated trip." }, { status: 500 });
    }

    return data({ id: insertedTrip.id });
  } catch (error) {
    console.error(
      "Error occurred while processing create-trip request:",
      error,
    );
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected server error." },
      { status: 500 },
    );
  }
};
