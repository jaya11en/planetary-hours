import axios from 'axios';

const url = 'http://www.planetaryhoursapi.com/api/';
const todayDateOffset = new Date().getTimezoneOffset() * 60000;
const todayDate = new Date();
const today = (new Date(Date.now() - todayDateOffset)).toISOString().split('T')[0];

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
    const todayLocal = (new Date(Date.now() - todayDateOffset)).toISOString().split('T')[0];
    const planetaryHours: PlanetaryHoursResponse = await axios.get(url + todayLocal + '/' + lat + ',' + long).then(r => r.data);

    // Apply elevation correction to the sunrise and sunset times
    const effectiveElevation = useElevation ? (typeof elevation === 'number' ? elevation : await getElevation(lat, long)) : 0;
    const correctedSunrise = getAdjustedTime(planetaryHours.Response.Solar.Sunrise, effectiveElevation, true);
    const correctedSunset = getAdjustedTime(planetaryHours.Response.Solar.Sunset, effectiveElevation, false);
    const correctedNextSunrise = getAdjustedTime(planetaryHours.Response.Lunar.NextSunrise, effectiveElevation, true);

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
    const planetaryHours: PlanetaryHoursResponse = await axios.get(url + today + '/' + lat + ',' + long).then(r => r.data);

    // Apply elevation correction
    const effectiveElevation = useElevation ? (typeof elevation === 'number' ? elevation : await getElevation(lat, long)) : 0;
    const correctedSunrise = getAdjustedTime(planetaryHours.Response.Solar.Sunrise, effectiveElevation, true);
    const correctedSunset = getAdjustedTime(planetaryHours.Response.Solar.Sunset, effectiveElevation, false);
    const correctedNextSunrise = getAdjustedTime(planetaryHours.Response.Lunar.NextSunrise, effectiveElevation, true);

    const correctedSunriseDate = new Date(today + 'T' + correctedSunrise);
    const correctedSunsetDate = new Date(today + 'T' + correctedSunset);
    const correctedNextSunriseDate = new Date(today + 'T' + correctedNextSunrise);

    const dayDuration = correctedSunsetDate.getTime() - correctedSunriseDate.getTime();
    const nightDuration = correctedNextSunriseDate.getTime() - correctedSunsetDate.getTime();

    const singleDayHourDuration = dayDuration / 12;
    const singleNightHourDuration = nightDuration / 12;

    const timeDate = new Date(today + "T" + time);
    if (!isDay && timeDate.getTime() <= correctedNextSunriseDate.getTime()) {
        timeDate.setDate(timeDate.getDay() + 1);
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

function getAdjustedTime(originalTime: string, elevation: number, isSunrise: boolean) {
    if (elevation === 0) {
        return originalTime;
    }

    const dipInArcminutes = 1.76 * Math.sqrt(elevation);
    const timeCorrectionInSeconds = dipInArcminutes * 4;

    const originalDate = new Date(today + "T" + originalTime);
    const adjustedDate = new Date(originalDate.getTime());

    if (isSunrise) {
        adjustedDate.setSeconds(adjustedDate.getSeconds() - timeCorrectionInSeconds);
    } else { // It's sunset
        adjustedDate.setSeconds(adjustedDate.getSeconds() + timeCorrectionInSeconds);
    }

    return adjustedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
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