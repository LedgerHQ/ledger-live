import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getIssuerFeeForToken } from "../logicPublic";

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
    };
  },
});

export const { useGetIssuerFeeQuery } = xrpApi;
