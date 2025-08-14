// React import not needed; component uses only props

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
    useElevation: boolean;
    setUseElevation: (useElevation: boolean) => void;
    elevation: number;
    setElevation: (elevation: number) => void;
}

const LocationForm: React.FC<LocationFormProps> = ({ latitude, setLatitude, longitude, setLongitude, coefficient, setCoefficient, offset, setOffset, useMidpointCoefficient, setUseMidpointCoefficient, useGeolocation, setUseGeolocation, isLocating, locationError, useOffset, setUseOffset, useElevation, setUseElevation, elevation, setElevation }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
            <form className="space-y-4">
                {/* Row: Current Location + Lat + Long */}
                <div className="grid grid-cols-[max-content_12rem_12rem] items-center gap-4 justify-start justify-items-start">
                    <label className="flex items-center gap-2">
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
                            className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="font-medium">Use Current Location</span>
                        {isLocating && <span className="text-sm text-gray-400">Getting location...</span>}
                    </label>
                    <div className="w-full">
                        <label className="block text-xs text-gray-300 mb-1">Latitude</label>
                        <input
                            type="number"
                            value={latitude}
                            onChange={(e) => setLatitude(Number(e.target.value))}
                            className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            disabled={useGeolocation}
                            step="0.000001"
                        />
                    </div>
                    <div className="w-full">
                        <label className="block text-xs text-gray-300 mb-1">Longitude</label>
                        <input
                            type="number"
                            value={longitude}
                            onChange={(e) => setLongitude(Number(e.target.value))}
                            className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            disabled={useGeolocation}
                            step="0.000001"
                        />
                    </div>
                </div>

                {/* Row: Use Elevation + Elevation */}
                <div className="grid grid-cols-[max-content_12rem_12rem] items-center gap-4 justify-start justify-items-start">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={useElevation}
                            onChange={(e) => setUseElevation(e.target.checked)}
                            className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="font-medium">Use Elevation</span>
                    </label>
                    {useElevation && (
                    <div className="w-full">
                            <label className="block text-xs text-gray-300 mb-1">Elevation (m)</label>
                            <input
                                type="number"
                                value={elevation}
                                onChange={(e) => setElevation(Number(e.target.value))}
                                className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                step="1"
                            />
                        </div>
                    )}
                </div>

                {/* Row: Midpoint Coefficient + Coefficient */}
                <div className="grid grid-cols-[max-content_12rem_12rem] items-center gap-4 justify-start justify-items-start">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={useMidpointCoefficient}
                            onChange={(e) => setUseMidpointCoefficient(e.target.checked)}
                            className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="font-medium">Use Midpoint Coefficient</span>
                    </label>
                    <div className="w-full">
                        <label className="block text-xs text-gray-300 mb-1">Coefficient</label>
                        <input
                            type="number"
                            value={coefficient}
                            onChange={(e) => setCoefficient(Number(e.target.value))}
                            className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            step="0.1"
                        />
                    </div>
                </div>

                {/* Row: Use Offset + Offset */}
                <div className="grid grid-cols-[max-content_12rem_12rem] items-center gap-4 justify-start justify-items-start">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={useOffset}
                            onChange={(e) => setUseOffset(e.target.checked)}
                            className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="font-medium">Use Offset</span>
                    </label>
                    {useOffset && (
                        <div className="w-full">
                            <label className="block text-xs text-gray-300 mb-1">Offset</label>
                            <input
                                type="number"
                                value={offset}
                                onChange={(e) => setOffset(Number(e.target.value))}
                                className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                step="0.1"
                            />
                        </div>
                    )}
                </div>
            </form>
            {locationError && <div className="text-red-500 text-sm mt-4">{locationError}</div>}
        </div>
    );
};

export default LocationForm;