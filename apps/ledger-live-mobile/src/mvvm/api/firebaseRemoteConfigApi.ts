import type { FirebaseRemoteConfigTypes } from "@react-native-firebase/remote-config";
import { createApi } from "@reduxjs/toolkit/query/react";
import { DEFAULT_FEATURES, formatDefaultFeatures } from "@ledgerhq/live-common/featureFlags/index";

export const firebaseRemoteConfigApi = createApi({
  reducerPath: "firebaseRemoteConfigApi",
  baseQuery: () => ({ data: null }),

  endpoints: build => ({
    init: build.mutation<null, FirebaseRemoteConfigTypes.Module>({
      queryFn: rc =>
        Promise.all([
          rc.setConfigSettings({ minimumFetchIntervalMillis: 0 }),
          rc.setDefaults(formatDefaultFeatures(DEFAULT_FEATURES)),
        ]).then(
          () => ({ data: null }),
          error => ({ error }),
        ),
    }),

    fetchAndActivate: build.query<boolean, FirebaseRemoteConfigTypes.Module>({
      queryFn: rc =>
        rc.fetchAndActivate().then(
          result => ({ data: result }),
          error => ({ error }),
        ),
    }),
  }),
});
