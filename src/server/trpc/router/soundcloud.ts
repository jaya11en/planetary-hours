import { router, publicProcedure } from "../trpc";
import { createChronologicalSoundcloudPlaylists } from "../../db/soundcloud";

export const soundcloudRouter = router({
    fetchKey: publicProcedure
      .query(({  }) => {
        return createChronologicalSoundcloudPlaylists();
      }),
    getAll: publicProcedure.query(({ ctx }) => {
      return ctx.prisma.example.findMany();
    }),
  });