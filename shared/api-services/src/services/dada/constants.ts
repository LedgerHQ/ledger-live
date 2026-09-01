/**
 * RTK Query reducer path for the DADA service.
 *
 * FROZEN as `assetsDataApi` rather than named after the service: `createCurrencyDataSelector` in the
 * feature layer hand-scans `state.assetsDataApi.queries` by string. Renaming it produces no type
 * error and silently returns `undefined` for every market and interest-rate lookup.
 */
export const DADA_REDUCER_PATH = "assetsDataApi";
