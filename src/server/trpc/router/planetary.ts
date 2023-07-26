import { router, publicProcedure } from "../trpc";
import { getPlanetaryHours, calculatePercentage } from '../../db/planetary';
import {z} from 'zod';
export const planetaryRouter = router({
    get: publicProcedure
        .input(z.object({coefficient: z.number()}))
        .query(async ({ input }) => {
            return getPlanetaryHours(input.coefficient);
        }),
    getPercentage: publicProcedure
        .input(z.object({ time: z.string(), isDay: z.boolean() }))
        .query(async ({ input }) => {
            return await calculatePercentage(input.time, input.isDay);
        }),
  });