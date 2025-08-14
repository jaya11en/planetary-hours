import axios from 'axios';
import * as SunCalc from 'suncalc';

const url = 'http://www.planetaryhoursapi.com/api/';
const todayDateOffset = new Date().getTimezoneOffset() * 60000;
const todayDate = new Date();
const today = (new Date(Date.now() - todayDateOffset)).toISOString().slice(0, 10);

export async function getPlanetaryHours(
    coefficient: number,
    lat: number,
    long: number,
    useMidpointCoefficient: boolean = false,
    offset: number = 1.5,
    useOffset: boolean = false,
    useElevation: boolean = false,
    elevation?: number,
) {
    const todayLocal = (new Date(Date.now() - todayDateOffset)).toISOString().slice(0, 10);
    const planetaryHours: PlanetaryHoursResponse = await axios.get(url + todayLocal + '/' + lat + ',' + long).then(r => r.data);

    // Compute sunrise/sunset with elevation using SunCalc (more accurate than fixed arcminute shift)
    const effectiveElevation = useElevation
        ? (typeof elevation === 'number' ? elevation : await getElevation(lat, long))
        : 0;

    const { sunriseDate, sunsetDate, nextSunriseDate } = getSunTimesWithElevation(lat, long, effectiveElevation);
    const correctedSunrise = formatAsTimeString(sunriseDate);
    const correctedSunset = formatAsTimeString(sunsetDate);
    const correctedNextSunrise = formatAsTimeString(nextSunriseDate);

    // Now, you need to reconstruct the planetary hours based on these new times.
    // This is the tricky part. The API gives you pre-calculated hours.
    // You cannot simply adjust the start/end times of the hours provided by the API,
    // because the *duration* of the daylight and night periods has changed.

    // You need to recalculate the planetary hours from scratch.
    // The API's `SolarHours` and `LunarHours` are no longer valid.
    // You have the 'Ruler' of each hour (e.g., Sun, Venus, Mercury, etc.) from the API.
    // You can use that sequence, but you need to determine the new duration of each hour.

    const correctedSunriseDate = new Date(todayLocal + 'T' + correctedSunrise);
    const correctedSunsetDate = new Date(todayLocal + 'T' + correctedSunset);
    const correctedNextSunriseDate = new Date(todayLocal + 'T' + correctedNextSunrise);
    // Ensure next sunrise is actually the next day, not same-day morning
    if (correctedNextSunriseDate.getTime() <= correctedSunsetDate.getTime()) {
        correctedNextSunriseDate.setDate(correctedNextSunriseDate.getDate() + 1);
    }

    // Calculate new total durations
    const dayDuration = correctedSunsetDate.getTime() - correctedSunriseDate.getTime();
    const nightDuration = correctedNextSunriseDate.getTime() - correctedSunsetDate.getTime();

    // Calculate the length of a single planetary day hour and night hour
    const singleDayHourDuration = dayDuration / 12;
    const singleNightHourDuration = nightDuration / 12;

    // Rebuild hour boundaries as Date objects, then filter from current time forward
    const now = new Date();

    const rebuiltSolar = Object.values(planetaryHours.Response.SolarHours).map((hour, index) => {
        const startDate = new Date(correctedSunriseDate.getTime() + (index * singleDayHourDuration));
        const endDate = new Date(startDate.getTime() + singleDayHourDuration);
        return { hour, startDate, endDate };
    });
    const filteredSolar = rebuiltSolar.filter(h => h.endDate.getTime() >= now.getTime());
    // If none remaining (e.g., after last hour), fall back to all 12 for safety
    const solarSet = filteredSolar.length > 0 ? filteredSolar : rebuiltSolar;
    const newSolarHours = solarSet.map(({ hour, startDate, endDate }) => ({
        ...hour,
        Start: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        End: endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    }));

    const rebuiltLunar = Object.values(planetaryHours.Response.LunarHours).map((hour, index) => {
        const startDate = new Date(correctedSunsetDate.getTime() + (index * singleNightHourDuration));
        const endDate = new Date(startDate.getTime() + singleNightHourDuration);
        return { hour, startDate, endDate };
    });
    // If current time is after midnight relative to sunset, make sure to include early-night hours crossing midnight
    const filteredLunar = rebuiltLunar.filter(h => {
        const end = new Date(h.endDate);
        // If the hour ends before (corrected) next sunrise, it's part of the night; keep if end >= now
        if (end.getTime() <= correctedNextSunriseDate.getTime()) {
            // if end is earlier than now but we are past midnight context, add a day to compare
            if (end.getTime() < now.getTime() && now.getDate() !== end.getDate()) {
                end.setDate(end.getDate() + 1);
            }
        }
        return end.getTime() >= now.getTime();
    });
    // If none remaining (e.g., after last hour), fall back to all 12
    const lunarSet = filteredLunar.length > 0 ? filteredLunar : rebuiltLunar;
    const newLunarHours = lunarSet.map(({ hour, startDate, endDate }) => ({
        ...hour,
        Start: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        End: endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    }));

    const solarHours = getTimes(
        Object.keys(planetaryHours.Response.SolarHours),
        newSolarHours,
        true,
        coefficient,
        correctedNextSunrise,
        useMidpointCoefficient,
        offset,
        useOffset
    );
    const lunarHours = getTimes(
        Object.keys(planetaryHours.Response.LunarHours),
        newLunarHours,
        false,
        coefficient,
        correctedNextSunrise,
        useMidpointCoefficient,
        offset,
        useOffset
    );

    return solarHours.concat(lunarHours);
}

export async function calculatePercentage(time: string, isDay: boolean, lat: number = 29.435420, long: number = -98.660530, useElevation: boolean = false, elevation?: number) {
    // Use SunCalc to get corrected sunrise/sunset for the given elevation
    const effectiveElevation = useElevation
        ? (typeof elevation === 'number' ? elevation : await getElevation(lat, long))
        : 0;
    const { sunriseDate, sunsetDate, nextSunriseDate } = getSunTimesWithElevation(lat, long, effectiveElevation);

    const correctedSunriseDate = sunriseDate;
    const correctedSunsetDate = sunsetDate;
    const correctedNextSunriseDate = nextSunriseDate;

    const dayDuration = correctedSunsetDate.getTime() - correctedSunriseDate.getTime();
    const nightDuration = correctedNextSunriseDate.getTime() - correctedSunsetDate.getTime();

    const singleDayHourDuration = dayDuration / 12;
    const singleNightHourDuration = nightDuration / 12;

    const timeDate = new Date(today + "T" + time);
    if (!isDay && timeDate.getTime() <= correctedNextSunriseDate.getTime()) {
        // Fix: use getDate() instead of getDay() when adding a calendar day
        timeDate.setDate(timeDate.getDate() + 1);
    }

    // Now, find the hour by recalculating them
    const baseDate = isDay ? correctedSunriseDate : correctedSunsetDate;
    const singleHourDuration = isDay ? singleDayHourDuration : singleNightHourDuration;

    const hourIndex = Math.floor((timeDate.getTime() - baseDate.getTime()) / singleHourDuration);

    if (hourIndex < 0 || hourIndex >= 12) {
      // Handle edge cases where the time is outside the planetary hour range
      return Promise.resolve({ percentage: "N/A" });
    }

    const startDate = new Date(baseDate.getTime() + (hourIndex * singleHourDuration));
    const endDate = new Date(startDate.getTime() + singleHourDuration);

    const timeDuration = timeDate.getTime() - startDate.getTime();
    const hourDuration = endDate.getTime() - startDate.getTime();
    const percentage = (timeDuration / hourDuration) * 100;

    return Promise.resolve({ percentage: percentage.toFixed(2) })
}

export interface HourBoundary {
    start: Date;
    end: Date;
}

export interface EquivalentPercentMappingEntry {
    oldHourIndex: number; // 0-11 for day or night
    newHourIndex: number; // hour index in the new system that contains t0
    anchors: Array<{ pOld: number; pNew: number; timeISO: string }>; // timeISO for t0
}

export interface EquivalentPercentMappingResult {
    date: string; // ISO yyyy-mm-dd
    elevationMeters: number;
    day: EquivalentPercentMappingEntry[];
    night: EquivalentPercentMappingEntry[];
    bestFit: {
        day: { a: number; b: number; delta: number; mseAffine: number; mseOffset: number };
        night: { a: number; b: number; delta: number; mseAffine: number; mseOffset: number };
    };
}

function buildHourBoundaries(sunrise: Date, sunset: Date, nextSunrise: Date) {
    const dayDurationMs = sunset.getTime() - sunrise.getTime();
    const nightDurationMs = nextSunrise.getTime() - sunset.getTime();
    const singleDayHourMs = dayDurationMs / 12;
    const singleNightHourMs = nightDurationMs / 12;

    const day: HourBoundary[] = Array.from({ length: 12 }, (_, i) => {
        const start = new Date(sunrise.getTime() + i * singleDayHourMs);
        const end = new Date(start.getTime() + singleDayHourMs);
        return { start, end };
    });

    const night: HourBoundary[] = Array.from({ length: 12 }, (_, i) => {
        const start = new Date(sunset.getTime() + i * singleNightHourMs);
        const end = new Date(start.getTime() + singleNightHourMs);
        return { start, end };
    });

    return { day, night };
}

function findContainingHour(boundaries: HourBoundary[], t: Date): number {
    const tMs = t.getTime();
    for (let i = 0; i < boundaries.length; i++) {
        const { start, end } = boundaries[i]!;
        if (tMs >= start.getTime() && tMs < end.getTime()) return i;
    }
    // If exactly equal to final end, snap to last hour
    return boundaries.length - 1;
}

/**
 * Map anchor percentages from a no-elevation system to the equivalent percentages with elevation.
 * Anchors default to the user's scheme: sevenths, their midpoints, and ±1/14 around midpoints.
 */
export async function mapEquivalentPercents(
    lat: number,
    long: number,
    useElevation: boolean = true,
    elevation?: number,
    anchorPercents?: number[],
): Promise<EquivalentPercentMappingResult> {
    return mapEquivalentPercentsBetweenLocations(
        lat,
        long,
        0, // old system assumed no elevation
        lat,
        long,
        useElevation ? (typeof elevation === 'number' ? elevation : await getElevation(lat, long)) : 0,
        anchorPercents,
    );
}

export async function mapEquivalentPercentsBetweenLocations(
    oldLat: number,
    oldLong: number,
    oldElevationMeters?: number,
    newLat: number,
    newLong: number,
    newElevationMeters?: number,
    anchorPercents?: number[],
): Promise<EquivalentPercentMappingResult> {
    const todayLocal = (new Date(Date.now() - todayDateOffset)).toISOString().slice(0, 10);

    // Default anchors: 0, for k=1..6: (k/7 - 1/14), (k/7), (k/7 + 1/14), and 13/14
    const defaultAnchors: number[] = Array.from({ length: 6 }, (_, k) => k + 1)
        .flatMap((k) => [k / 7 - 1 / 14, k / 7, k / 7 + 1 / 14])
        .concat([0, 13 / 14])
        .filter((p) => p >= 0 && p <= 1);
    const anchors = (anchorPercents ?? defaultAnchors)
        .map((p) => Math.max(0, Math.min(1, p)))
        .sort((a, b) => a - b);

    // Resolve elevations if not provided
    const resolvedOldElevation = typeof oldElevationMeters === 'number' ? oldElevationMeters : await getElevation(oldLat, oldLong);
    const resolvedNewElevation = typeof newElevationMeters === 'number' ? newElevationMeters : await getElevation(newLat, newLong);

    // Old system: specified old coords/elevation
    const oldTimes = getSunTimesWithElevation(oldLat, oldLong, resolvedOldElevation);
    // New system: specified new coords/elevation
    const newTimes = getSunTimesWithElevation(newLat, newLong, resolvedNewElevation);

    const oldBounds = buildHourBoundaries(oldTimes.sunriseDate, oldTimes.sunsetDate, oldTimes.nextSunriseDate);
    const newBounds = buildHourBoundaries(newTimes.sunriseDate, newTimes.sunsetDate, newTimes.nextSunriseDate);

    const mapFor = (oldSet: HourBoundary[], newSet: HourBoundary[]): EquivalentPercentMappingEntry[] =>
        oldSet.map((hb, idx) => {
            const dur0 = hb.end.getTime() - hb.start.getTime();
            const anchorsMapped = anchors.map((pOld) => {
                const t0 = new Date(hb.start.getTime() + pOld * dur0);
                const j = findContainingHour(newSet, t0);
                const newHb = newSet[j]!;
                const dur1 = newHb.end.getTime() - newHb.start.getTime();
                const pNew = (t0.getTime() - newHb.start.getTime()) / dur1;
                return { j, pOld, pNew: Math.max(0, Math.min(1, pNew)), timeISO: t0.toISOString() };
            });
            // Prefer the most common j among anchors as the mapped index; fallback to first
            const jCounts = new Map<number, number>();
            for (const a of anchorsMapped) jCounts.set(a.j, (jCounts.get(a.j) ?? 0) + 1);
            let newHourIndex = anchorsMapped[0]!.j;
            let maxC = -1;
            for (const [j, c] of jCounts) {
                if (c > maxC) { maxC = c; newHourIndex = j; }
            }
            return {
                oldHourIndex: idx,
                newHourIndex,
                anchors: anchorsMapped.map(({ pOld, pNew, timeISO }) => ({ pOld, pNew, timeISO })),
            };
        });

    const dayPairs: Array<{ x: number; y: number }> = [];
    const nightPairs: Array<{ x: number; y: number }> = [];

    const dayMap = mapFor(oldBounds.day, newBounds.day);
    const nightMap = mapFor(oldBounds.night, newBounds.night);

    for (const row of dayMap) {
        for (const a of row.anchors) dayPairs.push({ x: a.pOld, y: a.pNew });
    }
    for (const row of nightMap) {
        for (const a of row.anchors) nightPairs.push({ x: a.pOld, y: a.pNew });
    }

    const fitDay = linearFit(dayPairs);
    const fitNight = linearFit(nightPairs);

    return {
        date: todayLocal,
        elevationMeters: resolvedNewElevation,
        day: dayMap,
        night: nightMap,
        bestFit: { day: fitDay, night: fitNight },
    };
}

function linearFit(pairs: Array<{ x: number; y: number }>) {
    const n = pairs.length;
    if (n === 0) return { a: 0, b: 1, delta: 0, mseAffine: 0, mseOffset: 0 };
    let sumX = 0, sumY = 0, sumXX = 0, sumXY = 0, sumDY = 0;
    for (const { x, y } of pairs) {
        sumX += x; sumY += y; sumXX += x * x; sumXY += x * y; sumDY += (y - x);
    }
    const denom = n * sumXX - sumX * sumX;
    const b = Math.abs(denom) > 1e-9 ? (n * sumXY - sumX * sumY) / denom : 1;
    const a = (sumY - b * sumX) / n;
    const delta = sumDY / n; // offset-only model: y ≈ x + delta
    // Compute MSE for both models
    let mseAffine = 0, mseOffset = 0;
    for (const { x, y } of pairs) {
        const ya = a + b * x;
        const yo = x + delta;
        mseAffine += (y - ya) * (y - ya);
        mseOffset += (y - yo) * (y - yo);
    }
    mseAffine /= n; mseOffset /= n;
    return { a, b, delta, mseAffine, mseOffset };
}

function getSunTimesWithElevation(lat: number, long: number, heightMeters: number) {
    // Use local date at noon to avoid DST boundary issues
    const base = new Date();
    base.setHours(12, 0, 0, 0);

    const todayTimes = SunCalc.getTimes(base, lat, long, heightMeters);
    const sunriseDate = new Date(todayTimes.sunrise);
    const sunsetDate = new Date(todayTimes.sunset);

    // Next day sunrise
    const nextDay = new Date(base);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextTimes = SunCalc.getTimes(nextDay, lat, long, heightMeters);
    const nextSunriseDate = new Date(nextTimes.sunrise);

    return { sunriseDate, sunsetDate, nextSunriseDate };
}

function formatAsTimeString(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

async function getElevation(lat: number, long: number): Promise<number> {
    try {
        const resp = await axios.get(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${long}`);
        const elevation = resp?.data?.results?.[0]?.elevation;
        if (typeof elevation === 'number' && !Number.isNaN(elevation)) {
            return elevation;
        }
        return 0;
    } catch {
        return 0;
    }
}

function getTimes(
    names: string[],
    hours: Hour[],
    isDay: boolean,
    coefficient: number,
    nextSunrise: string,
    useMidpointCoefficient: boolean = false,
    offset: number = 1.5,
    useOffset: boolean = false
) {
    for (let i = 0; i < hours.length; i++) {
        if (hours[i] && names[i]) {
            hours[i]!.Name = names[i]!.split(/(?=[A-Z])/).join(" ");
        }
    }

    const now = todayDate;
    const filtered = hours.filter((time: Hour) => {
        const startDate = new Date(today + "T" + time.Start);
        const endDate = new Date(today + "T" + time.End);
        // For lunar hours that pass midnight, normalize comparison against next sunrise boundary
        if (!isDay && endDate.getTime() <= new Date(today + "T" + nextSunrise).getTime()) {
            endDate.setDate(endDate.getDate() + 1);
        }
        return endDate.getTime() >= now.getTime();
    });

    return filtered.map((time: Hour) => {
        const originalStartDate = new Date(today + "T" + time.Start);
        const originalEndDate = new Date(today + "T" + time.End);
        const originalDuration = originalEndDate.getTime() - originalStartDate.getTime();

        let adjustedStartDate = originalStartDate;
        let adjustedEndDate = originalEndDate;

        if (useOffset) {
            const offsetDuration = originalDuration * (offset / 100);
            adjustedStartDate = new Date(originalStartDate.getTime() + offsetDuration);
            adjustedEndDate = new Date(originalEndDate.getTime() + offsetDuration);
        }

        const adjustedTime = {
            ...time,
            Start: adjustedStartDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
            End: adjustedEndDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        };

        const timesIntoSevenths = getTimesBySevenths(today, adjustedTime.Start, adjustedTime.End, coefficient, useMidpointCoefficient, offset, useOffset);
        return {
            hour: adjustedTime, times: [...timesIntoSevenths]
        }
    })
}

function getTimesBySevenths(date: string | undefined, start: string, end: string, coefficient: number, useMidpointCoefficient: boolean = false, offset: number = 1.5, useOffset: boolean = false) {
    const startDate = new Date(date + "T" + start);
    const endDate = new Date(date + "T" + end);

    const time = (endDate.getTime() / 1000) - (startDate.getTime() / 1000);

    const colors = ['violet', 'indigo', 'blue', 'green', 'yellow', 'orange', 'red'];

    const times: any[] = [];
    for (let i = 1; i <= 7; i++) {
        const dateMiddle: Date = new Date(startDate);
        const dateBegin = new Date(dateMiddle);
        const dateCoefficient = new Date(dateMiddle);

        let style = `text-white`;
        pushPercentages(dateBegin, time, i, 1/7, times, style + ' text-right');
        if (!useMidpointCoefficient) {
            pushPercentages(dateCoefficient, time, i, 1/7 - coefficient/100, times, style + ' italic');  
                }
        pushPercentages(dateMiddle, time, i, 1/7/2, times, style + ' font-bold');
        if (useMidpointCoefficient) {
            pushPercentages(dateCoefficient, time, i, 1/7/2 - coefficient/100, times, style + ' italic');
                  
        }
    
        }

    return times;
}

function pushPercentages(date: Date, time: number, i: number, coefficient: number, times: any[], style: string) {

    date.setSeconds(date.getSeconds() + (time * (i / 7 - coefficient )));
    const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    times.push({
        percent:
            (((i / 7 - coefficient) * 100).toFixed(2) + "%"),
        time:
            timeString,
        style:
            style,
    });
}


interface PlanetaryHoursResponse {
    Response: Response
}

interface Response {
    General: GeneralInfo,
    Solar: SolarInfo,
    Lunar: LunarInfo,
    SolarHours: Record<string, Hour>,
    LunarHours: Record<string, Hour>
}
interface GeneralInfo {
    Date: string,
    DayOfTheWeek: string,
    PlanetaryRuler: string,
    Latitude: string,
    Longitude: string,
    TimezoneOffset: number
}

interface SolarInfo {
    Sunrise: string,
    SolarNoon: string,
    Sunset: string,
    DayLength: string,
    SolarHour: number
}

interface LunarInfo {
    Sunset: string,
    NextSunrise: string,
    NightLength: string,
    LunarHour: number,
    MoonPhase: string
}

interface Hour {
    Name: string,
    Start: string,
    End: string,
    Ruler: string
}