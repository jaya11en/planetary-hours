import { mapEquivalentPercentsBetweenLocations } from '../src/server/db/planetary';

async function main() {
  const oldLat = parseFloat(process.argv[2] ?? '29.4343455');
  const oldLong = parseFloat(process.argv[3] ?? '-98.6591473');
  const newLat = parseFloat(process.argv[4] ?? '29.6148509');
  const newLong = parseFloat(process.argv[5] ?? '-98.4805349');
  const oldElev = process.argv[6] ? parseFloat(process.argv[6]) : undefined; // meters
  const newElev = process.argv[7] ? parseFloat(process.argv[7]) : undefined; // meters

  const res = await mapEquivalentPercentsBetweenLocations(
    oldLat, oldLong, oldElev,
    newLat, newLong, newElev,
    // use the user's anchors
    [
      0.00, 0.015, 0.0714, 0.1429, 0.1579, 0.2143, 0.2857, 0.3007,
      0.3571, 0.4286, 0.4436, 0.5, 0.5714, 0.5864, 0.6429, 0.7143,
      0.7293, 0.7857, 0.8571, 0.8721, 0.9286,
    ]
  );

  console.log(JSON.stringify({
    date: res.date,
    newElevationMeters: res.elevationMeters,
    dayDelta: res.bestFit.day.delta,
    nightDelta: res.bestFit.night.delta,
    dayDeltaPct: res.bestFit.day.delta * 100,
    nightDeltaPct: res.bestFit.night.delta * 100,
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
