import React from 'react';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import MercuryIcon from './icons/MercuryIcon';
import VenusIcon from './icons/VenusIcon';
import MarsIcon from './icons/MarsIcon';
import JupiterIcon from './icons/JupiterIcon';
import SaturnIcon from './icons/SaturnIcon';

interface PlanetaryTimeMarker {
    percent: string;
    time: string;
    style: string;
}

interface PlanetaryHourData {
    hour: {
        Name: string;
        Ruler: string;
        Start: string;
        End: string;
    };
    times: PlanetaryTimeMarker[];
}

interface PlanetaryHourCardProps {
    planetaryHour: PlanetaryHourData;
    today: string;
    isCurrent?: boolean;
    expanded?: boolean;
}

// Accent colors mirror the pastel ruler colors defined in globals.css.
const PLANET_ACCENT: Record<string, string> = {
    Sun: '#ffd700',
    Moon: '#ccccff',
    Mercury: '#ffdab9',
    Venus: '#a7d9f0',
    Mars: '#ffb6c1',
    Jupiter: '#b19cd9',
    Saturn: '#ff9aa2',
};

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

const formatTime = (today: string, value: string) =>
    new Date(today + 'T' + value).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    });

const PlanetaryHourCard: React.FC<PlanetaryHourCardProps> = ({ planetaryHour, today, isCurrent = false, expanded = false }) => {
    const { Ruler, Name, Start, End } = planetaryHour.hour;
    const accent = PLANET_ACCENT[Ruler] ?? '#94a3d8';
    const rulerClass = `text-${Ruler.toLowerCase()}`;

    return (
        <div
            className="glass group relative flex flex-col overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1"
            style={{
                borderColor: isCurrent ? `${accent}80` : undefined,
                boxShadow: isCurrent
                    ? `0 0 0 1px ${accent}55, 0 18px 40px -20px ${accent}aa`
                    : '0 18px 40px -28px rgba(0,0,0,0.9)',
            }}
        >
            {/* Accent glow at the top of the card */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-70"
                style={{ background: `radial-gradient(120% 80% at 50% 0%, ${accent}33, transparent 70%)` }}
            />

            <div className="relative p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                            style={{
                                color: accent,
                                background: `${accent}1f`,
                                border: `1px solid ${accent}55`,
                            }}
                        >
                            {getPlanetIcon(Ruler)}
                        </span>
                        <div>
                            <div className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                                {Name}
                            </div>
                            <div className={`text-lg font-bold leading-tight ${rulerClass}`}>{Ruler}</div>
                        </div>
                    </div>

                    {isCurrent && (
                        <span
                            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                            style={{
                                color: accent,
                                background: `${accent}22`,
                                border: `1px solid ${accent}66`,
                                animation: 'pulse-ring 2.4s ease-in-out infinite',
                            }}
                        >
                            Now
                        </span>
                    )}
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
                    <span className="rounded-md bg-white/5 px-2 py-1 font-mono tabular-nums">
                        {formatTime(today, Start)}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className="rounded-md bg-white/5 px-2 py-1 font-mono tabular-nums">
                        {formatTime(today, End)}
                    </span>
                </div>
            </div>

            {/* Sevenths breakdown — dense marker list, collapsible to keep cards scannable */}
            <details className="group/dt relative mt-auto border-t border-white/5" open={expanded}>
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-xs font-medium text-gray-400 transition-colors hover:text-gray-200">
                    <span>Hourly breakdown</span>
                    <span className="text-gray-500 transition-transform duration-200 group-open/dt:rotate-180">
                        ⌄
                    </span>
                </summary>
                <div className="px-5 pb-4">
                    {/* Single-line "percent: time" markers — `time.style` keeps the
                        original left/right alignment (seventh-start markers are text-right). */}
                    <div className="space-y-0.5 font-mono text-xs tabular-nums">
                        {planetaryHour.times.map((time, index) => (
                            <p key={`${time.percent}-${index}`} className={time.style}>
                                {time.percent}: {time.time}
                            </p>
                        ))}
                    </div>
                </div>
            </details>
        </div>
    );
};

export default PlanetaryHourCard;
