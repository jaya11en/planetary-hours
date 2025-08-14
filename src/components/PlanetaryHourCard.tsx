import React from 'react';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import MercuryIcon from './icons/MercuryIcon';
import VenusIcon from './icons/VenusIcon';
import MarsIcon from './icons/MarsIcon';
import JupiterIcon from './icons/JupiterIcon';
import SaturnIcon from './icons/SaturnIcon';

interface PlanetaryHourCardProps {
    planetaryHour: any;
    today: string;
    isDay?: boolean;
    applyCalibration?: boolean;
    calibration?: { day: { a: number; b: number; delta: number; mseAffine: number; mseOffset: number }, night: { a: number; b: number; delta: number; mseAffine: number; mseOffset: number } };
    anchorPercents?: number[];
}

const PlanetaryHourCard: React.FC<PlanetaryHourCardProps> = ({ planetaryHour, today, isDay = true, applyCalibration = false, calibration, anchorPercents }) => {
    const getPlanetIcon = (ruler: string) => {
        switch (ruler) {
            case 'Sun':
                return <SunIcon />;
            case 'Moon':
                return <MoonIcon />;
            case 'Mercury':
                return <MercuryIcon />;
            case 'Venus':
                return <VenusIcon />;
            case 'Mars':
                return <MarsIcon />;
            case 'Jupiter':
                return <JupiterIcon />;
            case 'Saturn':
                return <SaturnIcon />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden" key={planetaryHour.hour.Name}>
            <div className={`p-6 text-${planetaryHour.hour.Ruler.toLowerCase()}`}>
                <div className="font-bold text-2xl mb-2 flex items-center">
                    {getPlanetIcon(planetaryHour.hour.Ruler)} 
                    <span className="ml-2">{planetaryHour.hour.Name} - {planetaryHour.hour.Ruler}</span>
                </div>
                <p className="text-gray-400 text-lg mb-4">
                    {new Date(today + "T" + planetaryHour.hour.Start).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })} - {new Date(today + "T" + planetaryHour.hour.End).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
                </p>
                <div>
                    {planetaryHour.times.map((time: any) => {
                        if (!applyCalibration || !calibration) {
                            return (
                                <p className={`text-base ${time.style}`} key={time.percent}>
                                    {time.percent}: {time.time}
                                </p>
                            );
                        }
                        // Parse percent like "15.79%"
                        const match = typeof time.percent === 'string' ? time.percent.match(/([\d.]+)%/) : null;
                        const pOld = match ? parseFloat(match[1]) / 100 : undefined;
                        if (pOld === undefined || Number.isNaN(pOld)) {
                            return (
                                <p className={`text-base ${time.style}`} key={time.percent}>
                                    {time.percent}: {time.time}
                                </p>
                            );
                        }
                        const fit = isDay ? calibration.day : calibration.night;
                        // Uniform offset mode: always apply delta relative to identity
                        const pNew = pOld + fit.delta;
                        const pNewPct = (Math.max(0, Math.min(1, pNew)) * 100).toFixed(2) + '%';
                        return (
                            <p className={`text-base ${time.style}`} key={time.percent}>
                                {time.percent} → {pNewPct}: {time.time}
                            </p>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PlanetaryHourCard;