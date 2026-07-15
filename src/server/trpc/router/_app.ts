import { router } from "../trpc";
import { exampleRouter } from "./example";
import { planetaryRouter } from './planetary'

export const appRouter = router({
  example: exampleRouter,
  planetary: planetaryRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
