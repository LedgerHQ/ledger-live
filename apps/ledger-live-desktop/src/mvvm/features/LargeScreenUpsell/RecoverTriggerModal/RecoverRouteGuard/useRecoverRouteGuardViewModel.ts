import { useFeature } from "@features/platform-feature-flags";
import { isNanoSOnlyWallet } from "@features/flow-large-screen-upsell";
import { useSelector } from "LLD/hooks/redux";
import { devicesModelListSelector } from "~/renderer/reducers/settings";

export type RecoverRouteGuardViewProps = Readonly<{
  shouldBlock: boolean;
}>;

export function useRecoverRouteGuardViewModel(): RecoverRouteGuardViewProps {
  const recoverFeature = useFeature("protectServicesDesktop");
  const devicesModelList = useSelector(devicesModelListSelector);
  const shouldBlock = Boolean(recoverFeature?.enabled && isNanoSOnlyWallet(devicesModelList));

  return { shouldBlock };
}
