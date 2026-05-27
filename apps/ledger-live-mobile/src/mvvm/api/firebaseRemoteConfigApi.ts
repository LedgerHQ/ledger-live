import { createApi } from "@reduxjs/toolkit/query/react";
import { whenReady } from "~/firebase/remoteConfig";

/**
 * Boot-gate proxy for Firebase remote config. The actual `setConfigSettings`,
 * `setDefaults`, and `fetchAndActivate` calls now live in
 * `~/firebase/remoteConfig` and are driven by the feature-flags middleware.
 * This mutation simply awaits the module's first-fetch signal so the existing
 * `useFirebaseRemoteConfig` / `WaitForAppReady` surface keeps working as the
 * `firebaseIsReady` boolean source.
 */
export const firebaseRemoteConfigApi = createApi({
  reducerPath: "firebaseRemoteConfigApi",
  baseQuery: () => ({ data: null }),

  endpoints: build => ({
    init: build.mutation<null, void>({
      queryFn: () => whenReady().then(() => ({ data: null })),
    }),
  }),
});
