import { router, publicProcedure } from "../trpc";
import { getPlanetaryHours, calculatePercentage, mapEquivalentPercents, mapEquivalentPercentsBetweenLocations } from '../../db/planetary';
import {z} from 'zod';
export const planetaryRouter = router({
    get: publicProcedure
        .input(z.object({
            coefficient: z.number(),
            latitude: z.number(),
            longitude: z.number(),
            useMidpointCoefficient: z.boolean().optional().default(false),
            offset: z.number().optional().default(1.5),
            useOffset: z.boolean().optional().default(true),
            useElevation: z.boolean().optional().default(false),
            elevation: z.number().optional(),
        }))
        .query(async ({ input }) => {
            return getPlanetaryHours(
                input.coefficient,
                input.latitude,
                input.longitude,
                input.useMidpointCoefficient,
                input.offset,
                input.useOffset,
                input.useElevation,
                input.elevation,
            );
        }),
    getPercentage: publicProcedure
        .input(z.object({ 
            time: z.string(), 
            isDay: z.boolean(),
            latitude: z.number(),
            longitude: z.number(),
            useElevation: z.boolean().optional().default(false),
            elevation: z.number().optional(),
        }))
        .query(async ({ input }) => {
            return await calculatePercentage(input.time, input.isDay, input.latitude, input.longitude, input.useElevation, input.elevation);
        }),
  });
  
export const mappingRouter = router({
    mapPercents: publicProcedure
      .input(z.object({
        latitude: z.number(),
        longitude: z.number(),
        useElevation: z.boolean().optional().default(true),
        elevation: z.number().optional(),
        anchorPercents: z.array(z.number()).optional(), // values in 0..1
      }))
      .query(async ({ input }) => {
        return await mapEquivalentPercents(
          input.latitude,
          input.longitude,
          input.useElevation,
          input.elevation,
          input.anchorPercents,
        );
      }),
    mapPercentsBetweenLocations: publicProcedure
      .input(z.object({
        oldLatitude: z.number(),
        oldLongitude: z.number(),
        oldElevation: z.number().optional().default(0),
        newLatitude: z.number(),
        newLongitude: z.number(),
        newElevation: z.number().optional().default(0),
        anchorPercents: z.array(z.number()).optional(),
      }))
      .query(async ({ input }) => {
        return await mapEquivalentPercentsBetweenLocations(
          input.oldLatitude,
          input.oldLongitude,
          input.oldElevation,
          input.newLatitude,
          input.newLongitude,
          input.newElevation,
          input.anchorPercents,
        );
      }),
});