import type { Middleware, Reducer } from "@reduxjs/toolkit";

/** Config every service that sends it reads from the same source, supplied once to `createExtra`. */
export type CommonConfig = { ledgerClientVersion: string };

type RtkApi = { reducerPath: string; reducer: Reducer; middleware: Middleware };

/** One service as an app registers it: its api and how to build its slice of `extraArgument`. */
export type ApiServiceDescriptor<Api extends RtkApi = RtkApi> = {
  api: Api;
  /** Reads the app config and validates it. Called once, at store creation, never at import. */
  buildExtra: (common: CommonConfig) => object;
};

type ReducersOf<D extends readonly ApiServiceDescriptor[]> = {
  [Descriptor in D[number] as Descriptor["api"]["reducerPath"]]: Descriptor["api"]["reducer"];
};

/**
 * Lists an app's services once: their reducers, their middlewares and their merged `extraArgument`.
 * Nothing is read from the app config until `createExtra` runs.
 */
export function defineApiServices<const D extends readonly ApiServiceDescriptor[]>(
  descriptors: D,
): {
  reducers: ReducersOf<D>;
  middlewares: Middleware[];
  createExtra(common: CommonConfig): object;
} {
  const reducers = Object.fromEntries(
    descriptors.map(({ api }) => [api.reducerPath, api.reducer]),
  ) as ReducersOf<D>;
  const middlewares = descriptors.map(({ api }) => api.middleware);

  function createExtra(common: CommonConfig): object {
    const extra: Record<string, unknown> = {};
    const owners: Record<string, string> = {};
    for (const { api, buildExtra } of descriptors) {
      for (const [key, value] of Object.entries(buildExtra(common))) {
        if (Object.hasOwn(extra, key) && !Object.is(extra[key], value)) {
          throw new Error(
            `${api.reducerPath} and ${owners[key]} give different values for extraArgument.${key}`,
          );
        }
        extra[key] = value;
        owners[key] = api.reducerPath;
      }
    }
    return extra;
  }

  return { reducers, middlewares, createExtra };
}

/** Store state of the services listed in a `defineApiServices` result. */
export type ApiServicesState<S extends { reducers: Record<string, Reducer> }> = {
  [K in keyof S["reducers"]]: ReturnType<S["reducers"][K]>;
};
