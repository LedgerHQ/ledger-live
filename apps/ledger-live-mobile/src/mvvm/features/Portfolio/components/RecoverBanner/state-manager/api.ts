import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getStoreValue, setStoreValue } from "~/store";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { RecoverBannerTags } from "./types";

export type RecoverBannerState = {
  subscriptionState: LedgerRecoverSubscriptionStateEnum;
  displayBanner: boolean;
};

export const recoverBannerApi = createApi({
  reducerPath: "recoverBannerApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: [RecoverBannerTags.BannerState],
  endpoints: builder => ({
    getRecoverBannerState: builder.query<RecoverBannerState, string>({
      queryFn: async protectId => {
        try {
          const subscriptionState = await getStoreValue<LedgerRecoverSubscriptionStateEnum>(
            "SUBSCRIPTION_STATE",
            protectId,
          );
          const displayBannerRaw = await getStoreValue<string>("DISPLAY_BANNER", protectId);
          return {
            data: {
              subscriptionState:
                subscriptionState ?? LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
              displayBanner: displayBannerRaw === "true",
            },
          };
        } catch (error) {
          return { error: { status: "CUSTOM_ERROR" as const, data: error } };
        }
      },
      providesTags: [RecoverBannerTags.BannerState],
    }),
    dismissRecoverBanner: builder.mutation<null, string>({
      queryFn: async protectId => {
        try {
          await Promise.resolve(setStoreValue("DISPLAY_BANNER", "false", protectId));
          return { data: null };
        } catch (error) {
          return { error: { status: "CUSTOM_ERROR" as const, data: error } };
        }
      },
      invalidatesTags: [RecoverBannerTags.BannerState],
    }),
  }),
});

export const { useGetRecoverBannerStateQuery, useDismissRecoverBannerMutation } = recoverBannerApi;
