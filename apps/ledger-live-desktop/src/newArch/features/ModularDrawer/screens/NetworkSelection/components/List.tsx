import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NetworkList } from "@ledgerhq/react-ui/pre-ldls";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import { ListWrapper } from "../../../components/ListWrapper";

type SelectNetworkProps = {
  networks?: CryptoOrTokenCurrency[];
  source: string;
  flow: string;
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
};

const CURRENT_PAGE = "Modular Network Selection";

export const SelectNetwork = ({
  networks,
  onNetworkSelected,
  source,
  flow,
}: SelectNetworkProps) => {
  if (!networks || networks.length === 0) {
    return null;
  }

  const onClick = (networkId: string) => {
    track("network_clicked", { network: networkId, page: "Modular Asset Flow", flow });
    const network = networks.find(({ id }) => id === networkId);
    if (!network) return;

    onNetworkSelected(network);
  };

  return (
    <ListWrapper>
      <TrackPage category={source} name={CURRENT_PAGE} flow={flow} />
      <NetworkList networks={networks} onClick={onClick} />
    </ListWrapper>
  );
};
