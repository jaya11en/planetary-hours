import axios from 'axios';

const url = 'http://www.planetaryhoursapi.com/api/';

// Compute a constant time shift (seconds) based on longitude difference only
function getLocationShiftSeconds(currentLongitude: number, referenceLongitude: number): number {
    const longDiffDegrees = currentLongitude - referenceLongitude; // east is positive
    const shiftMinutes = longDiffDegrees * 4; // 4 minutes solar time per degree
    return shiftMinutes * 60; // seconds
}

// Percent-based calibration from longitude only (user request):
// percent offset = -((Δlon * 4 minutes) / 60) * 100 = -(Δlon * 6.6667)
function getLongitudePercentOffset(
    currentLongitude: number,
    referenceLongitude: number,
): number {
    const longDiffDegrees = currentLongitude - referenceLongitude; // east is positive
    return -(longDiffDegrees * 16.4);
}

export async function getPlanetaryHours(
    coefficient: number,
    lat: number,
    long: number,
    useMidpointCoefficient: boolean = false,
    offset: number = 1.5,
    useOffset: boolean = false,
    useLocationCorrection: boolean = true,
    referenceLongitude: number = -98.6591473,
) {
    // Compute date-string and now at request time (not module load)
    const now = new Date();
    const todayDateOffset = now.getTimezoneOffset() * 60000;
    let today = (new Date(Date.now() - todayDateOffset)).toISOString().split('T')[0] as string;

    // Check if we're before sunrise (in lunar hours of previous planetary day)
    const tempData: PlanetaryHoursResponse = await axios.get(url + today + '/' + lat + ',' + long).then(r => r.data);
    const todaySunrise = new Date(today + "T" + tempData.Response.Solar.Sunrise);

    // If current time is before today's sunrise, we're in the previous planetary day
    if (now < todaySunrise) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        today = (new Date(yesterday.getTime() - todayDateOffset)).toISOString().split('T')[0] as string;
    }

    // Seconds-based shift no longer used for chat-legacy behavior
    const locationShiftSeconds = 0;
    // Percent-of-hour delta derived from longitude difference only
    const percentDelta = useLocationCorrection
        ? getLongitudePercentOffset(long, referenceLongitude)
        : 0;
    const planetaryHours: PlanetaryHoursResponse = await axios.get(url + today + '/' + lat + ',' + long).then(r => r.data);

    const solarHours = getTimes(
        today,
        now,
        Object.keys(planetaryHours.Response.SolarHours),
        Object.values(planetaryHours.Response.SolarHours),
        true,
        coefficient,
        planetaryHours.Response.Lunar.NextSunrise,
        useMidpointCoefficient,
        offset,
        useOffset,
        locationShiftSeconds,
        percentDelta,
    );
    const lunarHours = getTimes(
        today,
        now,
        Object.keys(planetaryHours.Response.LunarHours),
        Object.values(planetaryHours.Response.LunarHours),
        false,
        coefficient,
        planetaryHours.Response.Lunar.NextSunrise,
        useMidpointCoefficient,
        offset,
        useOffset,
        locationShiftSeconds,
        percentDelta,
    );

    return solarHours.concat(lunarHours);
}

export async function calculatePercentage(time: string, isDay: boolean, lat: number = 29.435420, long: number = -98.660530) {
    const now = new Date();
    const todayDateOffset = now.getTimezoneOffset() * 60000;
    const today = (new Date(Date.now() - todayDateOffset)).toISOString().split('T')[0];
    const planetaryHours: PlanetaryHoursResponse = await axios.get(url + today + '/' + lat + ',' + long).then(r => r.data);

    const timeDate = new Date(today + "T" + time);
    if (!isDay && timeDate.getTime() <= new Date(today + "T" + planetaryHours.Response.Lunar.NextSunrise).getTime()) {
        timeDate.setDate(timeDate.getDate() + 1);
    }

    const hour = Object.entries(isDay ? planetaryHours.Response.SolarHours : planetaryHours.Response.LunarHours).find(function (t: [string, Hour]) {
        const startDate = new Date(today + "T" + t[1].Start);
        const endDate = new Date(today + "T" + t[1].End);
        return (timeDate >= startDate && timeDate < endDate);
    })
    const startDate = new Date(today + "T" + (hour as [string, Hour])[1].Start);
    const endDate = new Date(today + "T" + (hour as [string, Hour])[1].End);
    if (!isDay && startDate.getTime() <= new Date(today + "T" + planetaryHours.Response.Lunar.NextSunrise).getTime()) {
        startDate.setDate(startDate.getDate() + 1);
        endDate.setDate(endDate.getDate() + 1);
    }

    const timeDuration = timeDate.getTime() - startDate.getTime();
    const hourDuration = endDate.getTime() - startDate.getTime();
    const percentage = timeDuration / hourDuration * 100;

    return Promise.resolve({ percentage: percentage.toFixed(2) })
}

function getTimes(
    today: string,
    now: Date,
    names: string[],
    hours: Hour[],
    isDay: boolean,
    coefficient: number,
    nextSunrise: string,
    useMidpointCoefficient: boolean = false,
    offset: number = 1.5,
    useOffset: boolean = false,
    locationShiftSeconds: number = 0,
    percentDelta: number = 0,
) {
    for (let i = 0; i < hours.length; i++) {
        if (hours[i] && names[i]) {
            hours[i]!.Name = names[i]!.split(/(?=[A-Z])/).join(" ");
        }
    }
    const times = hours.filter(function (time: Hour) {
        const timeDate = new Date(today + "T" + time.End);
        if (!isDay && timeDate.getTime() <= new Date(today + "T" + nextSunrise).getTime()) {
            timeDate.setDate(timeDate.getDate() + 1);
        }
        return (timeDate > now);
    })

        return times.map((time: Hour) => {
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

        const timesIntoSevenths = getTimesBySevenths(
            today,
            adjustedTime.Start,
            adjustedTime.End,
            coefficient,
            useMidpointCoefficient,
            locationShiftSeconds,
            percentDelta,
        );
        return {
            hour: adjustedTime, times: [...timesIntoSevenths]
        }
    })
}

function getTimesBySevenths(
    date: string | undefined,
    start: string,
    end: string,
    coefficient: number,
    useMidpointCoefficient: boolean = false,
    locationShiftSeconds: number = 0,
    percentDelta: number = 0,
) {
    const startDate = new Date(date + "T" + start);
    const endDate = new Date(date + "T" + end);

    // Handle midnight crossing: if end time is earlier than start time, add one day to end
    if (endDate <= startDate) {
        endDate.setDate(endDate.getDate() + 1);
    }

    const time = (endDate.getTime() / 1000) - (startDate.getTime() / 1000);

    // const colors = ['violet', 'indigo', 'blue', 'green', 'yellow', 'orange', 'red'];

    const times: { percent: string; time: string; style: string }[] = [];
    for (let i = 1; i <= 7; i++) {
        const dateMiddle: Date = new Date(startDate);
        const dateBegin = new Date(dateMiddle);
        const dateCoefficient = new Date(dateMiddle);

        const style = `text-white`;
        // Canonical start-of-seventh markers (no calibration shift)
        pushPercentages(dateBegin, time, i, 1/7, times, style + ' text-right', false, locationShiftSeconds, percentDelta);
        if (!useMidpointCoefficient) {
            // User target relative to start-of-seventh (apply calibration shift)
            pushPercentages(dateCoefficient, time, i, 1/7 - coefficient/100, times, style + ' italic', true, locationShiftSeconds, percentDelta);  
                }
        // Canonical midpoint of seventh (no calibration shift)
        pushPercentages(dateMiddle, time, i, 1/7/2, times, style + ' font-bold', false, locationShiftSeconds, percentDelta);
        if (useMidpointCoefficient) {
            // User target relative to midpoint-of-seventh (apply calibration shift)
            pushPercentages(dateCoefficient, time, i, 1/7/2 - coefficient/100, times, style + ' italic', true, locationShiftSeconds, percentDelta);
                  
        }
    
        }

    return times;
}

function pushPercentages(
    date: Date,
    time: number,
    i: number,
    coefficient: number,
    times: { percent: string; time: string; style: string }[],
    style: string,
    applyLocationShift: boolean = false,
    locationShiftSeconds: number = 0,
    percentDelta: number = 0,
) {
    // Compute base timestamp for the percentage marker
    date.setSeconds(date.getSeconds() + (time * (i / 7 - coefficient )));
    // Apply legacy percent-of-hour delta to user targets only
    if (applyLocationShift && percentDelta !== 0) {
        const percentOffset = percentDelta / 100; // convert to fraction
        date.setSeconds(date.getSeconds() - (time * percentOffset));
    }
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
    SolarHours: Hour[],
    LunarHours: Hour[]
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