import { useAccountDetailFeature } from "@features/flow-account-detail";
import { matchAccountRoute } from "../utils/matchAccountRoute";
import { useAccountFromRouteParams } from "./useRouteAccount";

export function useIsAccountDetailPage(pathname: string): boolean {
  const { mainAccount } = useAccountFromRouteParams(matchAccountRoute(pathname));
  return useAccountDetailFeature(mainAccount?.currency.id);
}
