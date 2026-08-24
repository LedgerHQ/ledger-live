import { useFeature } from "@features/platform-feature-flags";
import {
  isLargeScreenUpsellBannerEnabled,
  isNanoSOnlyWallet,
} from "@features/flow-large-screen-upsell";
import { useSelector } from "LLD/hooks/redux";
import { devicesModelListSelector } from "~/renderer/reducers/settings";

export type RecoverRouteGuardViewProps = Readonly<{
  shouldBlock: boolean;
}>;

export function useRecoverRouteGuardViewModel(): RecoverRouteGuardViewProps {
  const recoverFeature = useFeature("protectServicesDesktop");
  const largeScreenUpsell = useFeature("largeScreenUpsell");
  const devicesModelList = useSelector(devicesModelListSelector);
  const shouldBlock = Boolean(
    recoverFeature?.enabled &&
    isNanoSOnlyWallet(devicesModelList) &&
    isLargeScreenUpsellBannerEnabled(largeScreenUpsell, "recover-page-block-nano-s-only"),
  );

  return { shouldBlock };
}
