import React, { useMemo } from "react";
import BigNumber from "bignumber.js";
import { Asset } from "~/types/asset";
import { usePortfolioForAccounts } from "~/hooks/portfolio";
import AssetRow from "./AssetRow";
import AccountRow from "./AccountRow";
import { Account, ValueChange } from "@ledgerhq/types-live";
import { Pressable } from "react-native";

enum displayTypeEnum {
  Assets = "Assets",
  Accounts = "Accounts",
}

export interface Props {
  displayType: "Assets" | "Accounts";
  item: Asset | Account;
}

const RowLayout: React.FC<Props> = ({ displayType, item }) => {
  const shouldDisplayAssets = displayType === displayTypeEnum.Assets;

  const balance = useMemo(() => {
    return shouldDisplayAssets ? BigNumber((item as Asset).amount) : (item as Account).balance;
  }, [shouldDisplayAssets, item]);

  const portfolio = usePortfolioForAccounts(shouldDisplayAssets ? (item as Asset).accounts : []);
  const countervalueChange = useMemo(() => {
    return shouldDisplayAssets ? portfolio.countervalueChange : null;
  }, [shouldDisplayAssets, portfolio]);

  const accountBalance = useMemo(() => {
    return (item as Account).spendableBalance;
  }, [item]);

  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [
        { opacity: pressed ? 0.5 : 1.0, marginVertical: 12 },
      ]}
      hitSlop={6}
      onPress={() => console.log("Pressed")}
    >
      {shouldDisplayAssets ? (
        <AssetRow
          asset={item as Asset}
          balance={balance}
          countervalueChange={countervalueChange as ValueChange}
        />
      ) : (
        <AccountRow account={item as Account} balance={accountBalance} />
      )}
    </Pressable>
  );
};

export default RowLayout;
