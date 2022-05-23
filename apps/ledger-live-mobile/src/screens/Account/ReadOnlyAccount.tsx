import React from "react";
import { Box } from "@ledgerhq/native-ui";
import { AccountLike } from "@ledgerhq/live-common/lib/types";

import TabBarSafeAreaView from "../../components/TabBar/TabBarSafeAreaView";
import ReadOnlyAccountGraphCard from "../../components/ReadOnlyAccountGraphCard";
import ReadOnlyFabActions from "../../components/ReadOnlyFabActions";
import { TrackScreen } from "../../analytics";

import { withDiscreetMode } from "../../context/DiscreetModeContext";

type RouteParams = {
  accountId: string;
  parentId?: string;
};

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

const analytics = (
  <TrackScreen category="Account" currency={"bitcoin"} operationsSize={0} />
);

function ReadOnlyAccount({ navigation, route }: Props) {
  const account: AccountLike = {
    balance: 0,
    currency: {
      blockAvgTime: 15,
      coinType: 60,
      color: "#0ebdcd",
      ethereumLikeInfo: {
        baseChain: "mainnet",
        chainId: 1,
        hardfork: "petersburg",
        networkId: 1,
      },
      family: "ethereum",
      id: "ethereum",
      managerAppName: "Ethereum",
      name: "Ethereum",
      scheme: "ethereum",
      symbol: "Ξ",
      ticker: "ETH",
      type: "CryptoCurrency",
      units: [
        { code: "ETH", magnitude: 18, name: "ether" },
        { code: "Gwei", magnitude: 9, name: "Gwei" },
        { code: "Mwei", magnitude: 6, name: "Mwei" },
        { code: "Kwei", magnitude: 3, name: "Kwei" },
        { code: "wei", magnitude: 0, name: "wei" },
      ],
    },
    id: "1",
    type: "Account",
    name: "Ethereum",
    unit: { code: "ETH", magnitude: 18, name: "ether" },
  };

  return (
    <TabBarSafeAreaView edges={["bottom", "left", "right"]}>
      {analytics}
      <Box mx={6} my={6}>
        <ReadOnlyAccountGraphCard
          account={account}
          valueChange={{ percentage: 0, value: 0 }}
        />
      </Box>
      <Box py={3} mb={8}>
        <ReadOnlyFabActions />
      </Box>
    </TabBarSafeAreaView>
  );
}

export default withDiscreetMode(ReadOnlyAccount);
