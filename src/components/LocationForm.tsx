
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
    useLocationCorrection: boolean;
    setUseLocationCorrection: (useLocationCorrection: boolean) => void;
    referenceLongitude: number;
    setReferenceLongitude: (referenceLongitude: number) => void;
}

const LocationForm: React.FC<LocationFormProps> = ({ latitude, setLatitude, longitude, setLongitude, coefficient, setCoefficient, offset, setOffset, useMidpointCoefficient, setUseMidpointCoefficient, useGeolocation, setUseGeolocation, isLocating, locationError, useOffset, setUseOffset, useLocationCorrection, setUseLocationCorrection, referenceLongitude, setReferenceLongitude }) => {
    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-4">
            <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                        className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="font-medium text-sm">Use Current Location</label>
                    {isLocating && <div className="ml-2 text-xs text-gray-400">Getting location...</div>}
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Latitude</label>
                    <input
                        type="number"
                        value={latitude}
                        onChange={(e) => setLatitude(Number(e.target.value))}
                        className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                        disabled={useGeolocation}
                        step="0.000001"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Longitude</label>
                    <input
                        type="number"
                        value={longitude}
                        onChange={(e) => setLongitude(Number(e.target.value))}
                        className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                        disabled={useGeolocation}
                        step="0.000001"
                    />
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={useLocationCorrection}
                        onChange={(e) => setUseLocationCorrection(e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="font-medium text-sm">Use Location Correction</label>
                </div>
                {useLocationCorrection && (
                    <>
                        <div>
                            <label className="block text-xs font-medium mb-1">Reference Longitude (baseline)</label>
                            <input
                                type="number"
                                value={referenceLongitude}
                                onChange={(e) => setReferenceLongitude(Number(e.target.value))}
                                className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                                step="0.000001"
                            />
                        </div>
                        
                    </>
                )}

                {/* Line break to start Midpoint row */}
                <div className="col-span-full" />
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={useMidpointCoefficient}
                        onChange={(e) => setUseMidpointCoefficient(e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="font-medium text-sm">Offset from midpoint</label>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Target offset (%)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={coefficient}
                            onChange={(e) => setCoefficient(Number(e.target.value))}
                            className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                            step="0.1"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <span className="text-gray-400 text-xs">?</span>
                        </div>
                    </div>
                </div>

                {/* Line break to start Offset row */}
                <div className="col-span-full" />
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={useOffset}
                        onChange={(e) => setUseOffset(e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="font-medium text-sm">Use global hour % shift</label>
                </div>
                {useOffset ? (
                    <div>
                        <label className="block text-xs font-medium mb-1">Global hour % shift</label>
                        <input
                            type="number"
                            value={offset}
                            onChange={(e) => setOffset(Number(e.target.value))}
                            className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                            step="0.1"
                        />
                    </div>
                ) : (
                    // Placeholder to keep row structure while hiding form
                    <div className="hidden md:block" />
                )}
            
            </form>
            {locationError && <div className="text-red-500 text-sm mt-4">{locationError}</div>}
        </div>
    );
};

export default LocationForm;