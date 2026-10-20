import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { AccountActions } from "../components/AccountActions/AccountActions.native";
import { AccountBalance } from "../components/AccountBalance/AccountBalance.native";
import { InvestSheet } from "../components/InvestSheet/InvestSheet.native";
import type { AccountHeroPort } from "./types";
import { useAccountHeroViewModel } from "./useAccountHeroViewModel";

type Props = AccountHeroPort & Readonly<{ testID?: string }>;

export function AccountHero({ testID, ...port }: Props) {
  const {
    balance,
    tiles,
    moreActions,
    isMoreSheetOpen,
    onTilePress,
    onMoreActionPress,
    onCloseMoreSheet,
  } = useAccountHeroViewModel(port);

  return (
    <Box lx={{ gap: "s8" }} testID={testID}>
      <Box lx={{ height: "s176", alignItems: "center", justifyContent: "center" }}>
        <AccountBalance balance={balance} testID={testID && `${testID}-balance`} />
      </Box>
      <AccountActions
        tiles={tiles}
        onTilePress={onTilePress}
        testID={testID && `${testID}-actions`}
      />
      <InvestSheet
        isOpen={isMoreSheetOpen}
        actions={moreActions}
        onActionPress={onMoreActionPress}
        onClose={onCloseMoreSheet}
        testID={testID && `${testID}-more-sheet`}
      />
    </Box>
  );
}
