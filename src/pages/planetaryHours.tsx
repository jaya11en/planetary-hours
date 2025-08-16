import { type NextPage } from "next";
import { useState, useEffect } from "react";

import { trpc } from "../utils/trpc";
import LocationForm from "../components/LocationForm";
import PlanetaryHourCard from "../components/PlanetaryHourCard";

const PlanetaryHours: NextPage = () => {
    const [latitude, setLatitude] = useState<number>(29.4343455);
    const [longitude, setLongitude] = useState<number>(-98.6591473);
    const [coefficient, setCoefficient] = useState<number>(1.5); // Target offset (%)
    const [offset, setOffset] = useState<number>(1.7); // Global hour % shift
    const [useOffset, setUseOffset] = useState<boolean>(false);
    const [useLocationCorrection, setUseLocationCorrection] = useState<boolean>(true);
    const [referenceLongitude, setReferenceLongitude] = useState<number>(-98.6591473);
    const [calibrationMode, setCalibrationMode] = useState<'seconds' | 'percent'>('seconds');
    const [locationError, setLocationError] = useState<string>("");
    const [useMidpointCoefficient, setUseMidpointCoefficient] = useState<boolean>(false);
    const [useGeolocation, setUseGeolocation] = useState<boolean>(true);
    const [isLocating, setIsLocating] = useState<boolean>(false);

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
            setLatitude(29.4343455);
            setLongitude(-98.6591473);
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
        calibrationMode: calibrationMode,
    });

    const todayDateOffset = new Date().getTimezoneOffset() * 60000;
    const today: string = (new Date(Date.now() - todayDateOffset)).toISOString().split('T')[0] || '';

    // Percentage query removed to avoid unused value warning

    return (
        <div className="bg-gray-900 text-white min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <header className="text-center mb-8">
                    <h1 className="text-5xl font-bold">Planetary Hours</h1>
                    <p className="text-gray-400 mt-2">
                        Explore the mystical rhythm of the cosmos.
                    </p>
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
                    calibrationMode={calibrationMode}
                    setCalibrationMode={setCalibrationMode}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {planetaryHours.data?.map((planetaryHour, index: number) => (
                        <PlanetaryHourCard 
                            planetaryHour={planetaryHour} 
                            today={today} 
                            key={`${planetaryHour.hour?.Name || 'hour'}-${index}`} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PlanetaryHours;