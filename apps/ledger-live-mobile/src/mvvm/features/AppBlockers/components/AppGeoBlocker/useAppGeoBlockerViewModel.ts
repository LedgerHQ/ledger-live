import { ofacGeoBlockApi } from "@ledgerhq/live-common/api/ofacGeoBlockApi";

export function useAppGeoBlockerViewModel() {
  const { data: blocked = false } = ofacGeoBlockApi.useCheckQuery();
  return { blocked };
}
