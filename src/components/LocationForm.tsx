import { useState } from 'react';

interface LocationFormProps {
    latitude: number;
    setLatitude: (latitude: number) => void;
    longitude: number;
    setLongitude: (longitude: number) => void;
    coefficient: number;
    setCoefficient: (coefficient: number) => void;
    offset: number;
    setOffset: (offset: number) => void;
    useOffset: boolean;
    setUseOffset: (useOffset: boolean) => void;
    useMidpointCoefficient: boolean;
    setUseMidpointCoefficient: (useMidpointCoefficient: boolean) => void;
    useGeolocation: boolean;
    setUseGeolocation: (useGeolocation: boolean) => void;
    isLocating: boolean;
    locationError: string;
}

const LocationForm: React.FC<LocationFormProps> = ({ latitude, setLatitude, longitude, setLongitude, coefficient, setCoefficient, offset, setOffset, useMidpointCoefficient, setUseMidpointCoefficient, useGeolocation, setUseGeolocation, isLocating, locationError, useOffset, setUseOffset }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
            <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-center">
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
                        className="mr-3 h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="font-medium">Use Current Location</label>
                    {isLocating && <div className="ml-3 text-sm text-gray-400">Getting location...</div>}
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Latitude</label>
                    <input
                        type="number"
                        value={latitude}
                        onChange={(e) => setLatitude(Number(e.target.value))}
                        className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={useGeolocation}
                        step="0.000001"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Longitude</label>
                    <input
                        type="number"
                        value={longitude}
                        onChange={(e) => setLongitude(Number(e.target.value))}
                        className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={useGeolocation}
                        step="0.000001"
                    />
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={useMidpointCoefficient}
                        onChange={(e) => setUseMidpointCoefficient(e.target.checked)}
                        className="mr-3 h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="font-medium">Use Midpoint Coefficient</label>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Coefficient</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={coefficient}
                            onChange={(e) => setCoefficient(Number(e.target.value))}
                            className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            step="0.1"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-400 text-sm">?</span>
                        </div>
                    </div>
                </div>
                <div></div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={useOffset}
                        onChange={(e) => setUseOffset(e.target.checked)}
                        className="mr-3 h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="font-medium">Use Offset</label>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Offset</label>
                    <input
                        type="number"
                        value={offset}
                        onChange={(e) => setOffset(Number(e.target.value))}
                        className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        step="0.1"
                        disabled={!useOffset}
                    />
                </div>
                <div className="col-span-full lg:col-span-2"></div>
            
            </form>
            {locationError && <div className="text-red-500 text-sm mt-4">{locationError}</div>}
        </div>
    );
};

export default LocationForm;