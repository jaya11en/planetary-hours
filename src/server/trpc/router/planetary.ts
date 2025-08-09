import { router, publicProcedure } from "../trpc";
import { getPlanetaryHours, calculatePercentage } from '../../db/planetary';
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
        }))
        .query(async ({ input }) => {
            return getPlanetaryHours(input.coefficient, input.latitude, input.longitude, input.useMidpointCoefficient, input.offset, input.useOffset);
        }),
    getPercentage: publicProcedure
        .input(z.object({ 
            time: z.string(), 
            isDay: z.boolean(),
            latitude: z.number(),
            longitude: z.number(),
        }))
        .query(async ({ input }) => {
            return await calculatePercentage(input.time, input.isDay, input.latitude, input.longitude);
        }),
  });