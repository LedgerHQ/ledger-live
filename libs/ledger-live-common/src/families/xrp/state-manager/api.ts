import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getIssuerFeeForToken, getNetworkReservesForCurrency } from "../logicPublic";

export const xrpApi = createApi({
  reducerPath: "xrpApi",
  baseQuery: fakeBaseQuery<Error>(),
  endpoints: build => {
    return {
      getIssuerFee: build.query<string, TokenCurrency>({
        serializeQueryArgs: args => args.queryArgs.id,
        queryFn: async token => {
          try {
            const issuerFee = await getIssuerFeeForToken(token);

            return { data: issuerFee };
          } catch (error) {
            return { error: error instanceof Error ? error : new Error(String(error)) };
          }
        },
      }),
      getNetworkReserves: build.query<{ base: string; increment: string }, string>({
        queryFn: async currencyId => {
          try {
            const reserves = await getNetworkReservesForCurrency(currencyId);

            return { data: reserves };
          } catch (error) {
            return { error: error instanceof Error ? error : new Error(String(error)) };
          }
        },
      }),
    };
  },
});

export const { useGetIssuerFeeQuery, useGetNetworkReservesQuery } = xrpApi;
