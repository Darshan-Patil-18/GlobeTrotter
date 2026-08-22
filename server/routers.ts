import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { searchCities, searchPlaces, searchUnsplash } from "./travelApis";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  travel: router({
    cities: publicProcedure.input(z.object({ query: z.string().min(1).max(80) })).query(({ input }) => searchCities(input.query)),
    places: publicProcedure.input(z.object({ lat: z.number(), lon: z.number(), query: z.string().optional() })).query(({ input }) => searchPlaces(input.lat, input.lon, input.query)),
    images: publicProcedure.input(z.object({ query: z.string().min(1).max(80) })).query(({ input }) => searchUnsplash(input.query)),
  }),
  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
