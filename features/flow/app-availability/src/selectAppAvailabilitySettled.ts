import { ofacApi } from "@domain/api-ofac";

const selectOfacGeoBlockCheck = ofacApi.endpoints.checkOfacGeoBlock.select();

/**
 * Whether the app availability check has answered or failed, read from the store: the counterpart
 * of `useAppAvailability` leaving `pending`, for code that runs outside React. Like that hook, it is
 * the OFAC geo-block check alone today, and a check fetched again stays settled.
 *
 * @param state
 * The root state of a store with the `countervaluesApi` reducer mounted, which `ofacApi` injects into.
 */
export function selectAppAvailabilitySettled(state: unknown): boolean {
  // The endpoint's selector is typed on the api's own root state.
  const { data, error, isError, isSuccess } = selectOfacGeoBlockCheck(state as never);
  // RTK Query keeps `data` and `error`, but not its flags, while it fetches the check again.
  return isSuccess || isError || error !== undefined || data !== undefined;
}
