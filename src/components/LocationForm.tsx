import { useEffect, useRef, useState } from 'react';

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
    debug: boolean;
    setDebug: (debug: boolean) => void;
}

// Target-offset constraints. Presets sit one below each seventh-midpoint step;
// the allowed range is capped at half a seventh (1/14 ≈ 7.14%) unless debug is on.
const OFFSET_MIN = 0;
const OFFSET_MAX = 7.14;
const OFFSET_PRESETS = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5];
const clampOffset = (value: number) => Math.min(Math.max(value, OFFSET_MIN), OFFSET_MAX);

const inputClass =
    'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white shadow-inner outline-none transition focus:border-violet-400/60 focus:ring-1 focus:ring-violet-400/40';

const labelClass = 'mb-1 block text-xs font-medium text-gray-400';

const Toggle: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    hint?: string;
}> = ({ checked, onChange, label, hint }) => (
    <label className="flex cursor-pointer items-start gap-3">
        <span className="relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="peer sr-only"
            />
            <span className="h-5 w-9 rounded-full bg-white/15 transition peer-checked:bg-violet-500/80" />
            <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
        </span>
        <span>
            <span className="text-sm font-medium text-gray-200">{label}</span>
            {hint && <span className="mt-0.5 block text-xs text-gray-500">{hint}</span>}
        </span>
    </label>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
        {children}
    </div>
);

// Editable dropdown: type a custom value or click a preset from the menu.
const OffsetCombobox: React.FC<{
    value: number;
    onChange: (value: number) => void;
    presets: number[];
    min?: number;
    max?: number;
}> = ({ value, onChange, presets, min, max }) => {
    const [open, setOpen] = useState<boolean>(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    return (
        <div ref={ref} className="relative w-24">
            <div className="flex items-center rounded-lg border border-white/10 bg-black/30 shadow-inner transition focus-within:border-violet-400/60 focus-within:ring-1 focus-within:ring-violet-400/40">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full min-w-0 bg-transparent py-1.5 pl-2.5 pr-1 text-sm text-white outline-none"
                    step="0.1"
                    min={min}
                    max={max}
                    aria-label="Target offset percentage"
                />
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="flex h-8 w-6 shrink-0 items-center justify-center text-gray-400 transition hover:text-gray-200"
                    aria-label="Show preset offsets"
                    aria-expanded={open}
                >
                    <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>⌄</span>
                </button>
            </div>

            {open && (
                <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-white/10 bg-[#11142a] py-1 shadow-xl">
                    {presets.map((preset) => (
                        <li key={preset}>
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(preset);
                                    setOpen(false);
                                }}
                                className={`block w-full px-3 py-1.5 text-left text-sm transition hover:bg-white/10 ${
                                    value === preset ? 'text-violet-300' : 'text-gray-200'
                                }`}
                            >
                                {preset.toFixed(1)}%
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const LocationForm: React.FC<LocationFormProps> = ({
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    coefficient,
    setCoefficient,
    offset,
    setOffset,
    useMidpointCoefficient,
    setUseMidpointCoefficient,
    useGeolocation,
    setUseGeolocation,
    isLocating,
    locationError,
    useOffset,
    setUseOffset,
    useLocationCorrection,
    setUseLocationCorrection,
    referenceLongitude,
    setReferenceLongitude,
    debug,
    setDebug,
}) => {
    const [open, setOpen] = useState<boolean>(false);

    // Debug bypasses the range clamp; otherwise every path funnels through clampOffset.
    const applyOffset = (value: number) => setCoefficient(debug ? value : clampOffset(value));

    return (
        <div className="glass relative z-30 mb-8 rounded-2xl">
            {/* Always-visible: the calibration values changed most often */}
            <div className="px-5 py-5">
                <SectionLabel>Calibration</SectionLabel>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Toggle
                        checked={useMidpointCoefficient}
                        onChange={setUseMidpointCoefficient}
                        label="Offset from midpoint"
                        hint="Anchor target to the seventh's midpoint"
                    />
                    <div className="flex items-center gap-2">
                        <label className="whitespace-nowrap text-xs font-medium text-gray-400">
                            Target offset (%)
                        </label>
                        <OffsetCombobox
                            value={coefficient}
                            onChange={applyOffset}
                            presets={OFFSET_PRESETS}
                            min={debug ? undefined : OFFSET_MIN}
                            max={debug ? undefined : OFFSET_MAX}
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="mt-4 flex w-full items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:bg-white/5"
                >
                    <span className="flex items-center gap-3">
                        <span className="text-base" aria-hidden>
                            ⚙︎
                        </span>
                        <span>
                            <span className="block text-sm font-semibold text-gray-100">
                                Location &amp; more settings
                            </span>
                            <span className="block text-xs text-gray-400">
                                {isLocating
                                    ? 'Getting your location…'
                                    : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
                                {useGeolocation ? ' · auto' : ' · manual'}
                            </span>
                        </span>
                    </span>
                    <span
                        className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    >
                        ⌄
                    </span>
                </button>
            </div>

            {open && (
                <form className="space-y-6 border-t border-white/5 px-5 py-6">
                    {/* Location */}
                    <section>
                        <SectionLabel>Location</SectionLabel>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="flex items-center">
                                <Toggle
                                    checked={useGeolocation}
                                    onChange={(checked) => {
                                        setUseGeolocation(checked);
                                        if (!checked) {
                                            setLatitude(29.4343455);
                                            setLongitude(-98.6591473);
                                        }
                                    }}
                                    label="Use current location"
                                    hint="Read coordinates from your device"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Latitude</label>
                                <input
                                    type="number"
                                    value={latitude}
                                    onChange={(e) => setLatitude(Number(e.target.value))}
                                    className={`${inputClass} disabled:opacity-50`}
                                    disabled={useGeolocation}
                                    step="0.000001"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Longitude</label>
                                <input
                                    type="number"
                                    value={longitude}
                                    onChange={(e) => setLongitude(Number(e.target.value))}
                                    className={`${inputClass} disabled:opacity-50`}
                                    disabled={useGeolocation}
                                    step="0.000001"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Location correction */}
                    <section>
                        <SectionLabel>Location Correction</SectionLabel>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="flex items-center">
                                <Toggle
                                    checked={useLocationCorrection}
                                    onChange={setUseLocationCorrection}
                                    label="Use location correction"
                                    hint="Shift targets by longitude difference"
                                />
                            </div>
                            {useLocationCorrection && (
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Reference longitude (baseline)</label>
                                    <input
                                        type="number"
                                        value={referenceLongitude}
                                        onChange={(e) => setReferenceLongitude(Number(e.target.value))}
                                        className={inputClass}
                                        step="0.000001"
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Global shift + Debug */}
                    <section>
                        <SectionLabel>Global Shift</SectionLabel>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Toggle
                                checked={useOffset}
                                onChange={setUseOffset}
                                label="Use global hour % shift"
                                hint="Shift every hour by a fixed percentage"
                            />
                            <Toggle
                                checked={debug}
                                onChange={(checked) => {
                                    setDebug(checked);
                                    // Re-enforce the range when leaving debug mode.
                                    if (!checked) setCoefficient(clampOffset(coefficient));
                                }}
                                label="Debug mode"
                                hint={`Allow target offsets outside ${OFFSET_MIN}–${OFFSET_MAX}%`}
                            />
                        </div>
                        {useOffset && (
                            <div className="mt-4 md:w-1/2 md:pr-2">
                                <label className={labelClass}>Global hour % shift</label>
                                <input
                                    type="number"
                                    value={offset}
                                    onChange={(e) => setOffset(Number(e.target.value))}
                                    className={inputClass}
                                    step="0.1"
                                />
                            </div>
                        )}
                    </section>
                </form>
            )}

            {locationError && (
                <div className="rounded-b-2xl border-t border-white/5 bg-red-500/10 px-5 py-3 text-sm text-red-300">
                    {locationError}
                </div>
            )}
        </div>
    );
};

export default LocationForm;
