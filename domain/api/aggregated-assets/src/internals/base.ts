import { dadaApi } from "@shared/api-services";
import { AssetsDataTags } from "../types";

/*
 * `enhanceEndpoints` rather than `injectEndpoints`, which cannot declare `tagTypes`.
 *
 * All endpoint modules inject into this one base so a single cache slice serves every use case.
 * `createCurrencyDataSelector` hand-scans `state.assetsDataApi.queries` across every entry, so
 * splitting the slice would hide interest rates and market trend from callers of another endpoint.
 */
export const dadaBase = dadaApi.enhanceEndpoints({ addTagTypes: [AssetsDataTags.Assets] });
