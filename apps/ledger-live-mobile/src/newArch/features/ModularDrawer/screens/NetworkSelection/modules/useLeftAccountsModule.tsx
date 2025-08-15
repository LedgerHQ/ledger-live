import React from "react";
import { useSelector } from "react-redux";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Text } from "@ledgerhq/native-ui/index";

import { useTranslation } from "react-i18next";
import { type Network } from "@ledgerhq/native-ui/pre-ldls/index";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { accountsSelector } from "~/reducers/accounts";
import { getAccountTuplesForCurrency } from "@ledgerhq/live-common/utils/getAccountTuplesForCurrency";

const createAccountsCount = ({ label }: { label: string }) => (
  <Text variant="body" fontSize="12px" color="neutral.c80">
    {label}
  </Text>
);

const createAccountsCountAndApy = ({
  label,
  // value,
  // type,
}: {
  label: string;
  value: number;
  type: "NRR" | "APY" | "APR";
}) => (
  <>
    {createAccountsCount({ label })}
    {/* <ApyIndicator value={value} type={type} /> */}
  </>
);

type NetworkWithCount = Network & {
  count: number;
};

type AccountModuleParams = {
  assets: CryptoOrTokenCurrency[];
  accounts$?: Observable<WalletAPIAccount[]>;
};

const useAccountData = ({ assets, accounts$ }: AccountModuleParams) => {
  const { t } = useTranslation();
  const nestedAccounts = useSelector(accountsSelector);
  const accountIds = useGetAccountIds(accounts$);

  return assets
    .map(asset => {
      const { length } = getAccountTuplesForCurrency(asset, nestedAccounts, accountIds);
      const label = t("modularDrawer.accountCount", { count: length });

      return {
        asset,
        label,
        count: length,
      };
    })
    .sort((a, b) => {
      return b.count - a.count;
    });
};

export const useLeftAccountsModule = ({ assets, accounts$ }: AccountModuleParams) => {
  const accountData = useAccountData({ assets, accounts$ });

  return accountData.map(({ asset, label, count }) => ({
    ...asset,
    leftElement: count > 0 ? createAccountsCount({ label }) : undefined,
    count,
  }));
};

export const useLeftAccountsApyModule = ({
  assets,
  accounts$,
}: AccountModuleParams): NetworkWithCount[] => {
  const accountData = useAccountData({ assets, accounts$ });
  const value = 5.11; // TODO to be retrieved from DADA
  const type = "APY"; // TODO to be retrieved from DADA

  return accountData.map(({ asset, label, count }) => ({
    ...asset,
    leftElement: count > 0 ? createAccountsCountAndApy({ label, value, type }) : undefined,
    count,
  }));
};
