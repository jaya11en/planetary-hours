import { type NextPage } from "next";
import { useState, useEffect } from "react";

import { trpc } from "../utils/trpc";
import LocationForm from "../components/LocationForm";
import PlanetaryHourCard from "../components/PlanetaryHourCard";

const PlanetaryHours: NextPage = () => {
    const [latitude, setLatitude] = useState<number>(29.4343455);
    const [longitude, setLongitude] = useState<number>(-98.6591473);
    const [coefficient, setCoefficient] = useState<number>(1.5);
    const [offset, setOffset] = useState<number>(-1.3);
    const [useOffset, setUseOffset] = useState<boolean>(false);
    const [useElevation, setUseElevation] = useState<boolean>(true);
    const [elevation, setElevation] = useState<number>(0);
    const [time, setTime] = useState<string>(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    const [isDay, setIsDay] = useState<boolean>(true);
    const [locationError, setLocationError] = useState<string>("");
    const [useMidpointCoefficient, setUseMidpointCoefficient] = useState<boolean>(false);
    const [useGeolocation, setUseGeolocation] = useState<boolean>(true);
    const [isLocating, setIsLocating] = useState<boolean>(false);

    useEffect(() => {
        // Initialize time on component mount
        setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));

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

        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
        }, 1000);

        return () => clearInterval(timer);
    }, [useGeolocation]);

    // Fetch elevation when enabled and coordinates change
    useEffect(() => {
        const fetchElevation = async () => {
            if (!useElevation) return;
            try {
                const resp = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${latitude},${longitude}`);
                const data = await resp.json();
                const value = data?.results?.[0]?.elevation;
                if (typeof value === 'number' && !Number.isNaN(value)) {
                    setElevation(value);
                }
            } catch (err) {
                console.error('Failed to fetch elevation', err);
            }
        };
        fetchElevation();
    }, [latitude, longitude, useElevation]);

    const planetaryHours = trpc.planetary.get.useQuery({
        coefficient: coefficient,
        latitude: latitude,
        longitude: longitude,
        useMidpointCoefficient: useMidpointCoefficient,
        offset: offset,
        useOffset: useOffset,
        useElevation: useElevation,
        elevation: useElevation ? elevation : undefined,
    });

    const todayDateOffset = new Date().getTimezoneOffset() * 60000;
    const today: string = (new Date(Date.now() - todayDateOffset)).toISOString().split('T')[0] || '';

    const percentage = trpc.planetary.getPercentage.useQuery({
        time: time,
        isDay: isDay,
        latitude: latitude,
        longitude: longitude,
        useElevation: useElevation,
        elevation: useElevation ? elevation : undefined,
    });

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
                    useElevation={useElevation}
                    setUseElevation={setUseElevation}
                    elevation={elevation}
                    setElevation={setElevation}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {planetaryHours.data?.map((planetaryHour: any, index: number) => (
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