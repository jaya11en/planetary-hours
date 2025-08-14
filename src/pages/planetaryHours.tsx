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
    const [showMapping, setShowMapping] = useState<boolean>(false);
    const [applyCalibration, setApplyCalibration] = useState<boolean>(false);
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

    // Equivalent percent mapping (old system: no elevation) -> (current system: with elevation)
    const anchorPercents = [
        0.00, 0.015, 0.0714, 0.1429, 0.1579, 0.2143, 0.2857, 0.3007,
        0.3571, 0.4286, 0.4436, 0.5, 0.5714, 0.5864, 0.6429, 0.7143,
        0.7293, 0.7857, 0.8571, 0.8721, 0.9286,
    ];

    const mapping = trpc.mapping.mapPercents.useQuery({
        latitude: latitude,
        longitude: longitude,
        useElevation: useElevation,
        elevation: useElevation ? elevation : undefined,
        anchorPercents,
    }, { enabled: showMapping || applyCalibration });

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

                <div className="mb-6">
                    <button
                        className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
                        onClick={() => setShowMapping((v) => !v)}
                    >
                        {showMapping ? 'Hide' : 'Show'} equivalent percent mapping
                    </button>
                    <button
                        className="ml-3 px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
                        onClick={() => setApplyCalibration((v) => !v)}
                    >
                        {applyCalibration ? 'Stop applying' : 'Apply'} calibration to cards
                    </button>
                    {showMapping && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-800 rounded p-4 overflow-auto">
                                <h3 className="font-semibold mb-2">Day hours (old → new %)</h3>
                                {mapping.data ? (
                                    <ul className="space-y-2 text-sm">
                                        {mapping.data.day.map((row: any) => (
                                            <li key={`day-${row.oldHourIndex}`}>
                                                <span className="font-mono">Hour {row.oldHourIndex + 1} → {row.newHourIndex + 1}:</span>
                                                <span className="ml-2 font-mono">
                                                    {row.anchors
                                                        .map((a: any) => `${(a.pOld * 100).toFixed(2)}%→${(a.pNew * 100).toFixed(2)}%`)
                                                        .join('  |  ')}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-400">{mapping.isLoading ? 'Loading…' : 'No data'}</p>
                                )}
                            </div>
                            <div className="bg-gray-800 rounded p-4 overflow-auto">
                                <h3 className="font-semibold mb-2">Night hours (old → new %)</h3>
                                {mapping.data ? (
                                    <ul className="space-y-2 text-sm">
                                        {mapping.data.night.map((row: any) => (
                                            <li key={`night-${row.oldHourIndex}`}>
                                                <span className="font-mono">Hour {row.oldHourIndex + 1} → {row.newHourIndex + 1}:</span>
                                                <span className="ml-2 font-mono">
                                                    {row.anchors
                                                        .map((a: any) => `${(a.pOld * 100).toFixed(2)}%→${(a.pNew * 100).toFixed(2)}%`)
                                                        .join('  |  ')}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-400">{mapping.isLoading ? 'Loading…' : 'No data'}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {planetaryHours.data?.map((planetaryHour: any, index: number) => (
                        <PlanetaryHourCard 
                            planetaryHour={planetaryHour} 
                            today={today} 
                            isDay={index < 12}
                            applyCalibration={applyCalibration}
                            calibration={mapping.data?.bestFit}
                            anchorPercents={anchorPercents}
                            key={`${planetaryHour.hour?.Name || 'hour'}-${index}`} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PlanetaryHours;