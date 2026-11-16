import { ofacApi } from "@domain/api-ofac";

const selectOfacGeoBlockCheck = ofacApi.endpoints.checkOfacGeoBlock.select();

/**
 * Whether the OFAC geo-block check has answered or failed, read from the store: the counterpart of
 * `useAppAvailability` leaving `pending`, for code that runs outside React.
 *
 * @param state
 * The root state of a store the countervalues api is mounted in.
 */
export function selectAppAvailabilitySettled(state: unknown): boolean {
  // The endpoint's selector is typed on the api's own root state.
  const { isSuccess, isError } = selectOfacGeoBlockCheck(state as never);
  return isSuccess || isError;
}
