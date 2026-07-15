import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useRobinhoodDisclaimerBannerViewModel } from "./useRobinhoodDisclaimerBannerViewModel";
import { RobinhoodDisclaimerBannerView } from "./RobinhoodDisclaimerBannerView";

type RobinhoodDisclaimerBannerProps = Readonly<{
  distributionItem?: DistributionItem;
}>;

export function RobinhoodDisclaimerBanner({ distributionItem }: RobinhoodDisclaimerBannerProps) {
  const { show } = useRobinhoodDisclaimerBannerViewModel({ distributionItem });

  if (!show) return null;

  return <RobinhoodDisclaimerBannerView />;
}
