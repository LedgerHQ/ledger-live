import { dadaBase } from "../base";
import { buildAssetsQueryParams } from "../../requests";
import { resolveBaseUrl } from "../requests";
import { transformAssetsResponse } from "../../transforms";
import {
  AssetsDataTags,
  type AssetsDataWithPagination,
  type GetAssetsDataParams,
  type PageParam,
} from "../../types";

/** Query-driven use case: a cursor-paginated search over the whole aggregate. */
export const queryApi = dadaBase.injectEndpoints({
  endpoints: build => ({
    getAssetsData: build.infiniteQuery<AssetsDataWithPagination, GetAssetsDataParams, PageParam>({
      query: ({ pageParam, queryArg }) => ({
        url: `${resolveBaseUrl(queryArg)}/assets`,
        params: buildAssetsQueryParams(queryArg, { cursor: pageParam?.cursor }),
      }),
      providesTags: [AssetsDataTags.Assets],
      transformResponse: transformAssetsResponse,
      infiniteQueryOptions: {
        initialPageParam: { cursor: "" },
        getNextPageParam: lastPage =>
          lastPage.pagination.nextCursor ? { cursor: lastPage.pagination.nextCursor } : undefined,
      },
    }),
  }),
});
