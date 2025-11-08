import { Header } from "~/components";
import { ComboBoxComponent } from "@syncfusion/ej2-react-dropdowns";
import type { Route } from "./+types/create-trip";
import { comboBoxItems, selectItems } from "~/constants";
import { cn, formatKey } from "~/lib/utils";
import {
  LayerDirective,
  LayersDirective,
  MapsComponent,
} from "@syncfusion/ej2-react-maps";
import React, { useRef, useState } from "react";
import { world_map } from "~/constants/world_map";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { account } from "~/appwrite/client";
import { useNavigate } from "react-router";

export const loader = async () => {
  const response = await fetch(
    "https://restcountries.com/v3.1/all?fields=name,flags,latlng,maps",
  );

  const data = await response.json();
  return data.map((country: any) => ({
    name: country.name.common,
    flag: country.flags.png,
    coordinates: country.latlng,
    value: country.name.common,
    maps: country.maps?.openStreetMaps,
  }));
};

const CreateTrip = ({ loaderData }: Route.ComponentProps) => {
  const countries = loaderData as Country[];
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TripFormData>({
    country: "",
    travelStyle: "",
    interest: "",
    budget: "",
    duration: 0,
    groupType: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Refs for focusing invalid fields
  const countryRef = useRef<ComboBoxComponent | null>(null);
  const comboRefs: Record<
    "groupType" | "travelStyle" | "interest" | "budget",
    React.MutableRefObject<ComboBoxComponent | null>
  > = {
    groupType: useRef<ComboBoxComponent | null>(null),
    travelStyle: useRef<ComboBoxComponent | null>(null),
    interest: useRef<ComboBoxComponent | null>(null),
    budget: useRef<ComboBoxComponent | null>(null),
  };
  const durationRef = useRef<HTMLInputElement>(null);

  // Track per-field errors to show red borders
  const [fieldErrors, setFieldErrors] = useState<
    Record<keyof TripFormData, boolean>
  >({
    country: false,
    travelStyle: false,
    interest: false,
    budget: false,
    duration: false,
    groupType: false,
  });

  const focusField = (key: keyof TripFormData) => {
    if (key === "country") {
      countryRef.current?.element?.scrollIntoView?.({
        behavior: "smooth",
        block: "center",
      });
      if (countryRef.current && "focusIn" in countryRef.current) {
        // @ts-ignore Syncfusion method
        countryRef.current.focusIn();
      }
      return;
    }
    if (key === "duration") {
      durationRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      durationRef.current?.focus();
      return;
    }
    const ref = comboRefs[key as keyof typeof comboRefs];
    if (ref?.current) {
      ref.current.element?.scrollIntoView?.({
        behavior: "smooth",
        block: "center",
      });
      // @ts-ignore Syncfusion method
      ref.current.focusIn?.();
    }
  };

  const validateRequiredAndFocus = (): boolean => {
    // Reset all field errors first
    setFieldErrors((prev) => ({
      ...prev,
      country: false,
      duration: false,
      travelStyle: false,
      interest: false,
      budget: false,
      groupType: false,
    }));

    const requiredKeys: (keyof TripFormData)[] = [
      "country",
      "duration",
      "travelStyle",
      "interest",
      "budget",
      "groupType",
    ];

    const missing = requiredKeys.filter((k) => !formData[k]);
    if (missing.length > 0) {
      const first = missing[0];
      // Mark ALL missing fields with red borders, but focus only the first missing one
      const newErrors: Record<keyof TripFormData, boolean> = {
        country: false,
        travelStyle: false,
        interest: false,
        budget: false,
        duration: false,
        groupType: false,
      };
      missing.forEach((k) => {
        newErrors[k] = true;
      });
      setFieldErrors(newErrors);
      setError(
        `Please provide a ${first === "groupType" ? "Group Type" : first === "travelStyle" ? "Travel Style" : first.charAt(0).toUpperCase() + first.slice(1)}`,
      );
      focusField(first);
      setLoading(false);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!validateRequiredAndFocus()) {
      return;
    }

    if (formData.duration < 1 || formData.duration > 10) {
      setError("Duration must be between 1 and 10 days");
      setLoading(false);
      return;
    }

    const user = await account.get();
    if (!user.$id) {
      console.log("User not logged in");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/create-trip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country: formData.country,
          numberOfDays: formData.duration,
          travelStyle: formData.travelStyle,
          interests: formData.interest,
          budget: formData.budget,
          groupType: formData.groupType,
          userId: user.$id,
        }),
      });
      const result: CreateTripResponse = await response.json();
      if (result?.id) navigate(`/trips/${result.id}`);
      else console.log("Error creating trip");
    } catch (error) {
      console.error("Error logging trip:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (key: keyof TripFormData, value: string | number) => {
    setFormData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
    // Clear the error for this field when it becomes non-empty
    setFieldErrors(
      (prev) =>
        ({ ...prev, [key]: !value }) as Record<keyof TripFormData, boolean>,
    );
    if (error) setError(null);
  };
  const countriesData = countries.map((country) => ({
    text: country.name,
    value: country.value,
    flag: country.flag,
  }));

  const mapData = [
    {
      country: formData.country,
      color: "#EA382E",
      coordinates:
        countries.find((country) => country.name === formData.country)
          ?.coordinates || [],
    },
  ];
  return (
    <main className="flex flex-col gap-10 pb-20 wrapper">
      <Header
        title="Add a New Trip"
        description="View and edit AI Generated travel plans"
      />
      <section className="mt-2.5 wrapper-md">
        <form className="trip-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="country">Country</label>
            <ComboBoxComponent
              ref={countryRef}
              id="country"
              dataSource={countriesData}
              fields={{ text: "text", value: "value" }}
              value={formData.country}
              placeholder="Select a country"
              className={cn("combo-box", fieldErrors.country && "input-error")}
              change={(e: { value: string | undefined }) => {
                if (e.value) {
                  handleChange("country", e.value);
                }
              }}
              allowFiltering
              filtering={(e) => {
                const query = e.text.toLowerCase();
                e.updateData(
                  countries
                    .filter((country) =>
                      country.name.toLowerCase().includes(query),
                    )
                    .map((country) => ({
                      text: country.name,
                      value: country.value,
                      flag: country.flag,
                    })),
                );
              }}
              itemTemplate={(data: any) => (
                <div className="flex items-center gap-2">
                  <img
                    src={data.flag}
                    alt={data.text}
                    className="w-6 h-5 ml-2"
                  />
                  <p className="w-fit">{data.text}</p>
                </div>
              )}
            />
          </div>
          <div>
            <label htmlFor="duration">Duration</label>
            <input
              ref={durationRef}
              id="duration"
              name="duration"
              placeholder="Enter a number of days"
              className={cn(
                "form-input placeholder:text-gray-100",
                fieldErrors.duration && "input-error",
              )}
              onChange={(e) => handleChange("duration", Number(e.target.value))}
            />
          </div>

          {selectItems.map((key) => (
            <div key={key}>
              <label htmlFor={key}> {formatKey(key)}</label>
              <ComboBoxComponent
                ref={comboRefs[key as keyof typeof comboRefs]}
                id={key}
                dataSource={comboBoxItems[key].map((item) => ({
                  text: item,
                  value: item,
                }))}
                fields={{ text: "text", value: "value" }}
                placeholder={`Select ${formatKey(key)}`}
                className={cn("combo-box", fieldErrors[key] && "input-error")}
                change={(e: { value: string | undefined }) => {
                  if (e.value) {
                    handleChange(key, e.value);
                  }
                }}
                allowFiltering
                filtering={(e) => {
                  const query = e.text.toLowerCase();
                  e.updateData(
                    comboBoxItems[key]
                      .filter((item) => item.toLowerCase().includes(query))
                      .map((item) => ({
                        text: item,
                        value: item,
                      })),
                  );
                }}
              />
            </div>
          ))}
          <div>
            <label htmlFor="location">Location on the world map</label>
            <MapsComponent className="!flex !justify-center !items-center">
              <LayersDirective>
                <LayerDirective
                  dataSource={mapData}
                  shapeData={world_map}
                  shapeDataPath="country"
                  shapePropertyPath="name"
                  shapeSettings={{
                    colorValuePath: "color",
                    fill: "#E5E5E5",
                  }}
                />
              </LayersDirective>
            </MapsComponent>
          </div>
          <div className="bg-gray-200 h-px w-full" />
          {error && (
            <div className="error">
              <p>{error}</p>
            </div>
          )}
          <footer className="px-6 w-full">
            <ButtonComponent
              type="submit"
              className="button-class !h-12 !w-full"
              disabled={loading}
            >
              <img
                src={`/assets/icons/${loading ? "loader.svg" : "magic-star.svg"}`}
                className={cn("size-5", loading && "animate-spin")}
                alt={""}
              />
              <span className="p-16-semibold text-white">
                {loading ? "Generating..." : "Generate Trip"}
              </span>
            </ButtonComponent>
          </footer>
        </form>
      </section>
    </main>
  );
};
export default CreateTrip;
