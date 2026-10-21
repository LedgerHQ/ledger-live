import { useFeature } from "@features/platform-feature-flags";
import { isAccountDetailEnabledFor } from "../logic/isAccountDetailEnabledFor";

export function useAccountDetailFeature(currencyId: string | undefined): boolean {
  const feature = useFeature("accountDetail");
  return currencyId !== undefined && isAccountDetailEnabledFor(feature, currencyId);
}
