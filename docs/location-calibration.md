# Planetary Hours Location Calibration

## Purpose
When you move geographically, local solar events shift relative to wall-clock time. If your practice relies on clock-time targeting (e.g., hitting 1.50% after a marker), your learned timing can feel off even though the API’s planetary hour boundaries are correct for the new place. This doc explains the calibration added to preserve your clock-time targeting.

## Summary of the Approach
- Keep canonical markers and labels fixed (0.00%, 7.14%, 14.29%, 50.00%, etc.).
- Apply a constant time shift (in seconds) only to your user target lines (the coefficient-based lines).
- Make the reference (baseline) longitude configurable.

## The Calibration Formula
- Constant seconds shift based on longitude difference only:
  - locationShiftSeconds = (currentLongitude − referenceLongitude) × 4 × 60
  - 4 minutes of solar time per degree of longitude × 60 seconds
- Sign meaning:
  - Positive shift adds seconds (nudges target later on the clock)
  - Negative shift subtracts seconds (nudges target earlier on the clock)

### Example (your move)
- Old longitude (reference): −98.6591473
- New longitude: −98.4806423
- Δlon = (−98.4806423) − (−98.6591473) ≈ +0.1785° (moved east)
- Shift ≈ 0.1785 × 4 × 60 ≈ +42.8 seconds

Because local solar events happen earlier when you move east, adding ≈ +43 seconds to your target lines preserves your prior wall‑clock timing alignment.

## Why Seconds (Not Percent)
- Planetary hour lengths vary through the day and seasons.
- A fixed percent-of-hour correction would yield different clock-time adjustments for different hours.
- A fixed seconds shift keeps the wall‑clock nudge uniform and predictable.

## What the API Returns vs. Calibration
- API: physically correct planetary hour boundaries for the given date and coordinates (already includes longitude effects, time zone, etc.).
- Calibration: a user-specific adjustment layer to preserve your practiced clock-time targeting learned at a baseline location.
- We do not change canonical markers or labels. We only shift your coefficient-derived target times.

## Why the Previous Version Didn’t Preserve Clock Time
- It modified the labels themselves by adding a “location offset” into the coefficient, so canonical percentages (0.00%, 7.14%, …) moved. Then “1.50%” was no longer the same target you trained on.
- It used a percent-of-hour correction, which varies by hour length, so the clock-time delta wasn’t constant across hours.
- It applied globally (canonical markers and targets), moving too much and conflating frames of reference.
- It duplicated longitude effects conceptually; the API already handles longitude for boundaries. The correction should only align your chosen targets to the wall clock.

## UI and Backend Wiring
- `Use Location Correction` toggle enables/disables the calibration.
- `Reference Longitude (baseline)` sets the baseline longitude (defaults to your old apartment).
- The UI passes `useLocationCorrection` and `referenceLongitude` to the backend (tRPC), which applies the shift.
- Canonical markers remain unchanged; only target lines (coefficient-based) are shifted by `locationShiftSeconds`.

## Implementation Notes
- Helper: `getLocationShiftSeconds(currentLongitude, referenceLongitude)` returns seconds.
- Applied only in the functions that create user target timestamps; labels are computed from canonical fractions and are not altered.
- Bug fix: in night calculations, date rollover uses `setDate(getDate() + 1)` (not `getDay()`).

## When to Flip the Sign
- If you want your target to occur earlier (e.g., to preserve the solar fraction rather than clock time), subtract the shift instead of adding it.
- Current default preserves clock-time targeting learned at the baseline location (so moving east adds seconds to compensate for earlier solar timing).

## Caveats
- This is a first-order correction (longitude only). It intentionally ignores atmospheric and elevation effects because those differences are small and vary; the constant seconds approach remains consistent and simple.
- For advanced users: you can set a different baseline longitude at any time to recalibrate.
