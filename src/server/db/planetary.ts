import axios from 'axios';

const url = 'http://www.planetaryhoursapi.com/api/';
const todayDateOffset = new Date().getTimezoneOffset() * 60000;
const todayDate = new Date();
const today = (new Date(Date.now() - todayDateOffset)).toISOString().split('T')[0];

// const latitude = '26.39636'
// const longitude = ' -98.84492'

const latitude = '29.435420'
const longitude = '-98.660530'

export async function getPlanetaryHours(coefficient: number) {

    const planetaryHours: PlanetaryHoursResponse = await axios.get(url + today + '/' + latitude + ',' + longitude).then(r => r.data);

    const solarHours = getTimes(Object.keys(planetaryHours.Response.SolarHours), Object.values(planetaryHours.Response.SolarHours), true, coefficient, planetaryHours.Response.Lunar.NextSunrise);
    const lunarHours = getTimes(Object.keys(planetaryHours.Response.LunarHours), Object.values(planetaryHours.Response.LunarHours), false, coefficient, planetaryHours.Response.Lunar.NextSunrise);

    return Promise.all([...solarHours, ...lunarHours]);
}

export async function calculatePercentage(time: string, isDay: boolean) {
    const planetaryHours: PlanetaryHoursResponse = await axios.get(url + today + '/' + latitude + ',' + longitude).then(r => r.data);

    const timeDate = new Date(today + "T" + time);
    if (!isDay && timeDate.getTime() <= new Date(today + "T" + planetaryHours.Response.Lunar.NextSunrise).getTime()) {
        timeDate.setDate(timeDate.getDay() + 1);
    }

    const hour: any = Object.entries(isDay ? planetaryHours.Response.SolarHours : planetaryHours.Response.LunarHours).find(function (t: any) {
        let startDate = new Date(today + "T" + t[1].Start);
        let endDate = new Date(today + "T" + t[1].End);
        return (timeDate >= startDate && timeDate < endDate);
    })
    let startDate = new Date(today + "T" + hour[1].Start);
    let endDate = new Date(today + "T" + hour[1].End);
    if (!isDay && startDate.getTime() <= new Date(today + "T" + planetaryHours.Response.Lunar.NextSunrise).getTime()) {
        startDate.setDate(startDate.getDay() + 1);
        endDate.setDate(endDate.getDay() + 1);
    }

    const timeDuration = timeDate.getTime() - startDate.getTime();
    const hourDuration = endDate.getTime() - startDate.getTime();
    const percentage = timeDuration / hourDuration * 100;

    return Promise.resolve({ percentage: percentage.toFixed(2) })
}

function getTimes(names: string[], hours: Hour[], isDay: boolean, coefficient: number, nextSunrise: string) {
    for (let i = 0; i < hours.length; i++) {
        hours[i].Name = names[i]?.split(/(?=[A-Z])/).join(" ");
    }
    const times = hours.filter(function (time: Hour) {
        const timeDate = new Date(today + "T" + time.End);
        if (!isDay && timeDate.getTime() <= new Date(today + "T" + nextSunrise).getTime()) {
            timeDate.setDate(timeDate.getDate() + 1);
        }
        return (timeDate > todayDate);
    })

    return times.map((time: Hour) => {
        const timesIntoSevenths = getTimesBySevenths(today, time.Start, time.End, coefficient);
        return {
            hour: time, times: [...timesIntoSevenths]
        }
    })
}

function getTimesBySevenths(date: string | undefined, start: string, end: string, coefficient: number) {
    const startDate = new Date(date + "T" + start);
    const endDate = new Date(date + "T" + end);

    const time = (endDate.getTime() / 1000) - (startDate.getTime() / 1000);

    const colors = ['violet', 'indigo', 'blue', 'green', 'yellow', 'orange', 'red'];

    const times: any[] = [];
    for (let i = 1; i <= 7; i++) {
        const dateMiddle: Date = new Date(startDate) //: new Date(endDate);
        const dateBegin = new Date(dateMiddle);
        const dateCoefficient = new Date(dateMiddle)

        let style = `text-${colors[i-1]}-600`;
        pushPercentages(dateBegin, time, i, 1/7, times, style + ' text-right');
        pushPercentages(dateCoefficient, time, i, 1/7 - coefficient/100, times, style + ' italic');
        
        pushPercentages(dateMiddle, time, i, 1/7/2, times, style + ' font-bold');

        //pushPercentages(dateCoefficient, time, i, 1/7/2 - coefficient/100, times, style + ' italic');

    }

    return  times;
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