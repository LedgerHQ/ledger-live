import React from "react";
import { Banner } from "@ledgerhq/lumen-ui-react";

type Props = Readonly<{
  isVisible: boolean;
  currencyName: string;
}>;

// A development tool, like the local nodes it points at: not translated
export function LocalNodeAccountBannerView({ isVisible, currencyName }: Props) {
  if (!isVisible) return null;

  return (
    <Banner
      className="mb-24 mt-24"
      appearance="warning"
      title="Local node"
      description={`${currencyName} runs on a local chain, not on mainnet: its balance and history only exist on this machine.`}
      data-testid="local-node-account-banner"
    />
  );
}
