import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NetworkList } from "@ledgerhq/react-ui/pre-ldls";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";

type SelectNetworkProps = {
  networks: CryptoOrTokenCurrency[];
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
  source: string;
  flow: string;
};

export const SelectNetwork = ({
  networks,
  onNetworkSelected,
  source,
  flow,
}: SelectNetworkProps) => {
  const onClick = (networkId: string) => {
    track("network_clicked", { network: networkId, page: "Modular Asset Flow", flow });

    const network = networks.find(({ id }) => id === networkId);
    if (!network) return;

    onNetworkSelected(network);
  };

  return (
    <>
      <TrackPage category={source} name="Modular Network Selection" flow={flow} />
      <div style={{ flex: "1 1 auto", width: "100%" }}>
        <NetworkList networks={networks} onClick={onClick} />
      </div>
    </>
  );
};
