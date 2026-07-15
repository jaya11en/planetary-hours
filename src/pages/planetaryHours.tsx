import { type NextPage } from "next";
import { useState, useEffect } from "react";

import { trpc } from "../utils/trpc";
import LocationForm from "../components/LocationForm";
import PlanetaryHourCard from "../components/PlanetaryHourCard";

const DEFAULT_LAT = 29.4343455;
const DEFAULT_LONG = -98.6591473;

const LEGEND = [
    { label: "Seventh start", className: "text-white" },
    { label: "Calibrated target", className: "text-white italic" },
    { label: "Midpoint", className: "text-white font-bold" },
];

const PlanetaryHours: NextPage = () => {
    const [latitude, setLatitude] = useState<number>(DEFAULT_LAT);
    const [longitude, setLongitude] = useState<number>(DEFAULT_LONG);
    const [coefficient, setCoefficient] = useState<number>(1.5); // Target offset (%)
    const [offset, setOffset] = useState<number>(1.7); // Global hour % shift
    const [useOffset, setUseOffset] = useState<boolean>(false);
    const [useLocationCorrection, setUseLocationCorrection] = useState<boolean>(true);
    const [referenceLongitude, setReferenceLongitude] = useState<number>(DEFAULT_LONG);
    const [locationError, setLocationError] = useState<string>("");
    const [useMidpointCoefficient, setUseMidpointCoefficient] = useState<boolean>(false);
    const [useGeolocation, setUseGeolocation] = useState<boolean>(true);
    const [isLocating, setIsLocating] = useState<boolean>(false);
    const [debug, setDebug] = useState<boolean>(false); // unlocks target-offset values outside 0–7.14

    useEffect(() => {
        if ("geolocation" in navigator && useGeolocation) {
            setIsLocating(true);
            setLocationError("");
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLatitude(position.coords.latitude);
                    setLongitude(position.coords.longitude);
                    setIsLocating(false);
                },
                (error) => {
                    setLocationError("Unable to get your location. Please enter coordinates manually.");
                    console.error("Error getting location:", error);
                    setIsLocating(false);
                }
            );
        } else if (!useGeolocation) {
            setLatitude(DEFAULT_LAT);
            setLongitude(DEFAULT_LONG);
        } else {
            setLocationError("Geolocation is not supported by your browser. Please enter coordinates manually.");
        }

        return () => {
            // no-op cleanup
        };
    }, [useGeolocation]);

    const planetaryHours = trpc.planetary.get.useQuery({
        coefficient: coefficient,
        latitude: latitude,
        longitude: longitude,
        useMidpointCoefficient: useMidpointCoefficient,
        offset: offset,
        useOffset: useOffset,
        useLocationCorrection: useLocationCorrection,
        referenceLongitude: referenceLongitude,
    });

    const todayDateOffset = new Date().getTimezoneOffset() * 60000;
    const today: string = (new Date(Date.now() - todayDateOffset)).toISOString().split('T')[0] || '';

    const hours = planetaryHours.data ?? [];
    const currentRuler = hours[0]?.hour?.Ruler ?? null;

    return (
        <div className="relative min-h-screen text-white">
            <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <header className="mb-10 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-300/70">
                        The rhythm of the cosmos
                    </p>
                    <h1 className="mt-3 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-5xl font-bold text-transparent sm:text-6xl">
                        Planetary Hours
                    </h1>
                    {currentRuler ? (
                        <p className="mt-4 text-gray-300">
                            Now ruled by{" "}
                            <span className={`font-semibold text-${currentRuler.toLowerCase()}`}>
                                {currentRuler}
                            </span>
                        </p>
                    ) : (
                        <p className="mt-4 text-gray-400">Explore the mystical rhythm of the cosmos.</p>
                    )}
                </header>

                <LocationForm
                    latitude={latitude}
                    setLatitude={setLatitude}
                    longitude={longitude}
                    setLongitude={setLongitude}
                    coefficient={coefficient}
                    setCoefficient={setCoefficient}
                    offset={offset}
                    setOffset={setOffset}
                    useOffset={useOffset}
                    setUseOffset={setUseOffset}
                    useMidpointCoefficient={useMidpointCoefficient}
                    setUseMidpointCoefficient={setUseMidpointCoefficient}
                    useGeolocation={useGeolocation}
                    setUseGeolocation={setUseGeolocation}
                    isLocating={isLocating}
                    locationError={locationError}
                    useLocationCorrection={useLocationCorrection}
                    setUseLocationCorrection={setUseLocationCorrection}
                    referenceLongitude={referenceLongitude}
                    setReferenceLongitude={setReferenceLongitude}
                    debug={debug}
                    setDebug={setDebug}
                />

                {/* Marker legend */}
                <div className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
                    <span className="uppercase tracking-widest text-gray-500">Breakdown markers:</span>
                    {LEGEND.map((item) => (
                        <span key={item.label} className={`${item.className}`}>
                            {item.label}
                        </span>
                    ))}
                </div>

                {planetaryHours.isLoading ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="glass h-56 animate-pulse rounded-2xl"
                                style={{ animationDelay: `${i * 80}ms` }}
                            />
                        ))}
                    </div>
                ) : planetaryHours.isError ? (
                    <div className="glass rounded-2xl p-10 text-center">
                        <p className="text-lg font-semibold text-red-300">Couldn&apos;t load planetary hours</p>
                        <p className="mt-2 text-sm text-gray-400">
                            The planetary hours service may be unavailable. Try again in a moment.
                        </p>
                    </div>
                ) : hours.length === 0 ? (
                    <div className="glass rounded-2xl p-10 text-center">
                        <p className="text-lg font-semibold text-gray-200">No remaining hours today</p>
                        <p className="mt-2 text-sm text-gray-400">
                            All of today&apos;s planetary hours have passed. Check back after the next sunrise.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {hours.map((planetaryHour, index: number) => (
                            <PlanetaryHourCard
                                planetaryHour={planetaryHour}
                                today={today}
                                isCurrent={index === 0}
                                expanded={index < 4}
                                key={`${planetaryHour.hour?.Name || 'hour'}-${index}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlanetaryHours;
