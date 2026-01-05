import React from "react";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { CryptoBanner } from "@ledgerhq/crypto-banner";

type Props = {
  variant: ABTestingVariants;
};

const MarketPerformanceWidget = ({ variant }: Props) => {
  return <CryptoBanner product="lld" version="1.0.0" />;
};

export default React.memo(MarketPerformanceWidget);
