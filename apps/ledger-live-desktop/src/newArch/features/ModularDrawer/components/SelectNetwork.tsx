import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NetworkList } from "@ledgerhq/react-ui/pre-ldls";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Box, Flex } from "@ledgerhq/react-ui/index";

type SelectNetworkProps = {
  networks: CryptoOrTokenCurrency[];
  source: string;
  flow: string;
  onNetworkSelected: (network: CryptoOrTokenCurrency) => void;
};

const CURRENT_PAGE = "Modular Network Selection";
const ROW_HEIGHT = 64;
const SPACING = 16;
const THREE_ROWS_HEIGHT = 3 * ROW_HEIGHT;
const EXTRA_BOTTOM_MARGIN = THREE_ROWS_HEIGHT - SPACING;
const EXTRA_PADDING_HIDDEN_SCROLLBAR = 12;

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
    <Box style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TrackPage category={source} name={CURRENT_PAGE} flow={flow} />
      <Flex
        style={{
          flex: "1",
          overflow: "auto",
          width: `calc(100% + ${EXTRA_PADDING_HIDDEN_SCROLLBAR + "px"})`,
          paddingBottom: `${EXTRA_BOTTOM_MARGIN}px`,
        }}
      >
        <NetworkList networks={networks} onClick={onClick} />
      </Flex>
    </Box>
  );
};
