import { type ActionFunctionArgs, data } from "react-router";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseMarkdownToJson } from "~/lib/utils";
import supabase from "~/supabase/supabase";

export const action = async ({ request }: ActionFunctionArgs) => {
  const {
    country,
    numberOfDays,
    travelStyle,
    interests,
    budget,
    groupType,
    userId,
  } = await request.json();

  const genAi = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY!);
  const unsplashApiKey = process.env.VITE_UNSPLASH_API_KEY!;

  try {
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
      "interests": ${interests},
      "groupType": "${groupType}",
      "rating": "Give me the global average rating for this trip/package across all major travel platforms and sources. Return the rating number only."
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

    // 🔹 Generate trip data using Gemini
    const textResult = await genAi
      .getGenerativeModel({ model: "gemini-2.0-flash" })
      .generateContent(prompt);

    const trip = parseMarkdownToJson(textResult.response.text());

    // 🔹 Fetch trip images from Unsplash
    const imageResponse = await fetch(
      `https://api.unsplash.com/search/photos?query=${country} ${interests} ${travelStyle}&client_id=${unsplashApiKey}`,
    );

    const imageUrls = (await imageResponse.json()).results
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
      throw error;
    }

    return data({ id: insertedTrip.id });
  } catch (error) {
    console.error(
      "Error occurred while processing create-trip request:",
      error,
    );
    throw error;
  }
};
