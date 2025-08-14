import SunCalc from 'suncalc';
import axios from 'axios';

function localNoon() {
  const d = new Date();
  d.setHours(12,0,0,0);
  return d;
}

async function getElevation(lat, lon) {
  try {
    const resp = await axios.get(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
    const e = resp?.data?.results?.[0]?.elevation;
    return (typeof e === 'number' && !Number.isNaN(e)) ? e : 0;
  } catch {
    return 0;
  }
}

function buildHourBoundaries(sunrise, sunset, nextSunrise) {
  const dayDur = sunset.getTime() - sunrise.getTime();
  const nightDur = nextSunrise.getTime() - sunset.getTime();
  const dayHour = dayDur / 12;
  const nightHour = nightDur / 12;
  const day = Array.from({length:12}, (_,i)=>{
    const start = new Date(sunrise.getTime() + i*dayHour);
    const end = new Date(start.getTime() + dayHour);
    return {start, end};
  });
  const night = Array.from({length:12}, (_,i)=>{
    const start = new Date(sunset.getTime() + i*nightHour);
    const end = new Date(start.getTime() + nightHour);
    return {start, end};
  });
  return {day, night};
}

function linearDelta(pairs){
  if (!pairs.length) return 0;
  const delta = pairs.reduce((s, {x,y})=> s + (y - x), 0) / pairs.length;
  return delta;
}

function getTimesWithElevation(lat, lon, height){
  const base = localNoon();
  const today = SunCalc.getTimes(base, lat, lon, height);
  const sunrise = new Date(today.sunrise);
  const sunset = new Date(today.sunset);
  const next = new Date(base); next.setDate(next.getDate()+1);
  const nxt = SunCalc.getTimes(next, lat, lon, height);
  const nextSunrise = new Date(nxt.sunrise);
  return { sunrise, sunset, nextSunrise };
}

function pairsFromBounds(oldSet, newSet, anchors){
  const pairs = [];
  for (const hb of oldSet){
    const dur0 = hb.end.getTime() - hb.start.getTime();
    for (const p of anchors){
      const t0 = new Date(hb.start.getTime() + p * dur0);
      const idx = newSet.findIndex(h => t0 >= h.start && t0 < h.end);
      const j = idx >= 0 ? idx : newSet.length - 1;
      const hb1 = newSet[j];
      const dur1 = hb1.end.getTime() - hb1.start.getTime();
      const pNew = (t0.getTime() - hb1.start.getTime()) / dur1;
      pairs.push({x:p, y:Math.max(0, Math.min(1, pNew))});
    }
  }
  return pairs;
}

async function main(){
  const oldLat = parseFloat(process.argv[2] ?? '29.4343455');
  const oldLon = parseFloat(process.argv[3] ?? '-98.6591473');
  const newLat = parseFloat(process.argv[4] ?? '29.6148509');
  const newLon = parseFloat(process.argv[5] ?? '-98.4805349');

  const anchors = [
    0.00, 0.015, 0.0714, 0.1429, 0.1579, 0.2143, 0.2857, 0.3007,
    0.3571, 0.4286, 0.4436, 0.5, 0.5714, 0.5864, 0.6429, 0.7143,
    0.7293, 0.7857, 0.8571, 0.8721, 0.9286,
  ];

  // Old system: assume height 0 (no elevation)
  const oldTimes = getTimesWithElevation(oldLat, oldLon, 0);
  // New system: use actual elevation
  const newHeight = await getElevation(newLat, newLon);
  const newTimes = getTimesWithElevation(newLat, newLon, newHeight);

  const oldB = buildHourBoundaries(oldTimes.sunrise, oldTimes.sunset, oldTimes.nextSunrise);
  const newB = buildHourBoundaries(newTimes.sunrise, newTimes.sunset, newTimes.nextSunrise);

  const dayPairs = pairsFromBounds(oldB.day, newB.day, anchors);
  const nightPairs = pairsFromBounds(oldB.night, newB.night, anchors);

  const dayDelta = linearDelta(dayPairs);
  const nightDelta = linearDelta(nightPairs);

  console.log(JSON.stringify({
    date: new Date().toISOString().slice(0,10),
    newElevationMeters: newHeight,
    dayDelta,
    nightDelta,
    dayDeltaPct: dayDelta*100,
    nightDeltaPct: nightDelta*100,
  }, null, 2));
}

main().catch(e=>{ console.error(e); process.exit(1); });
