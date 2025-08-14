import { router } from "../trpc";
import { exampleRouter } from "./example";
import { soundcloudRouter } from "./soundcloud";
import { planetaryRouter } from './planetary'
import { mappingRouter } from './planetary'

export const appRouter = router({
  example: exampleRouter,
  soundcloud: soundcloudRouter,
  planetary: planetaryRouter,
  mapping: mappingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
