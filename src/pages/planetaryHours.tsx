import { type NextPage } from "next";
import { useState, useEffect } from "react";

import { trpc } from "../utils/trpc";

const planetaryHours: NextPage = () => {
    const [latitude, setLatitude] = useState<number>(29.4343455);
    const [longitude, setLongitude] = useState<number>(-98.6591473);
    const [coefficient, setCoefficient] = useState<number>(1.5);
    const [time, setTime] = useState<string>("");
    const [isDay, setIsDay] = useState<boolean>(true);
    const [locationError, setLocationError] = useState<string>("");
    const [useMidpointCoefficient, setUseMidpointCoefficient] = useState<boolean>(false);
    const [useGeolocation, setUseGeolocation] = useState<boolean>(false);

    useEffect(() => { 
        // Initialize time on component mount
        setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
        
        if ("geolocation" in navigator && useGeolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLatitude(position.coords.latitude);
                    setLongitude(position.coords.longitude);
                },
                (error) => {
                    setLocationError("Unable to get your location. Please enter coordinates manually.");
                    console.error("Error getting location:", error);
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

    const planetaryHours = trpc.planetary.get.useQuery({
        coefficient: coefficient,
        latitude: latitude,
        longitude: longitude,
        useMidpointCoefficient: useMidpointCoefficient,
    });
    
    const todayDateOffset = new Date().getTimezoneOffset() * 60000;
    const today = (new Date(Date.now() - todayDateOffset)).toISOString().split('T')[0];
    const dateTime = new Date(today + "T" + time);
    
    const percentage = trpc.planetary.getPercentage.useQuery({
        time: time,
        isDay: isDay,
        latitude: latitude,
        longitude: longitude,
    });

    const updateInputValue = (evt: any) => {
        const val = evt.target.value;
        setTime(val);
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-4xl font-bold">Planetary Hours</h1>
            <div className="mt-4">
                <form className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center">
                        <label className="mr-2">Use Current Location:</label>
                        <input
                            type="checkbox"
                            checked={useGeolocation}
                            onChange={(e) => {
                                setUseGeolocation(e.target.checked);
                                if (!e.target.checked) {
                                    setLatitude(29.4343455);
                                    setLongitude(-98.6591473);
                                }
                            }}
                            className="mr-2"
                        />
                    </div>
                    <div className="flex items-center">
                        <label className="mr-2">Latitude:</label>
                        <input
                            type="number"
                            value={latitude}
                            onChange={(e) => setLatitude(Number(e.target.value))}
                            className="border rounded px-2 py-1"
                            disabled={useGeolocation}
                            step="0.000001"
                        />
                    </div>
                    <div className="flex items-center">
                        <label className="mr-2">Longitude:</label>
                        <input
                            type="number"
                            value={longitude}
                            onChange={(e) => setLongitude(Number(e.target.value))}
                            className="border rounded px-2 py-1"
                            disabled={useGeolocation}
                            step="0.000001"
                        />
                    </div>
                    <div className="flex items-center">
                        <label className="mr-2">Coefficient:</label>
                        <input
                            type="number"
                            value={coefficient}
                            onChange={(e) => setCoefficient(Number(e.target.value))}
                            className="border rounded px-2 py-1"
                            step="0.1"
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-2"
                            checked={useMidpointCoefficient}
                            onChange={(e) => setUseMidpointCoefficient(e.target.checked)}
                        />
                        <label>Use midpoint coefficient</label>
                    </div>
                    {locationError && <div className="text-red-500 text-sm">{locationError}</div>}
                </form>
                <div className="grid grid-cols-4 gap-4 content-around">
                    {planetaryHours.data?.map((planetaryHour: any) => (
                        <div className="max-w-sm rounded overflow-hidden shadow-lg" key={planetaryHour.hour[0]}>
                            <div className="px-6 py-4">
                                <div className="font-bold text-xl mb-1">
                                    {planetaryHour.hour.Name + " - " + planetaryHour.hour.Ruler}
                                </div>
                                <div className={`text-gray-700 text-base mb-1 text-${planetaryHour.hour.Ruler.toLowerCase()}`}>
                                    {new Date(today + "T" + planetaryHour.hour.Start).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }) +
                                    " - " +
                                    new Date(today + "T" + planetaryHour.hour.End).toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })}
                                </div>
                                <div>
                                    {planetaryHour.times.map((time: any) => (
                                        <p className={`text-gray-700 text-base ${time.style}`} key={time.percent}>
                                            {time.percent + ": " + time.time}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default planetaryHours;