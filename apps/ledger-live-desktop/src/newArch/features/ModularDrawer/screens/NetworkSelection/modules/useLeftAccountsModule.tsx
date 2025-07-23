import React from "react";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Text } from "@ledgerhq/react-ui/index";
import { getAccountTuplesForCurrency } from "../../../utils/getAccountTuplesForCurrency";
import { useTranslation } from "react-i18next";
import { Network } from "@ledgerhq/react-ui/pre-ldls/index";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import ApyIndicator from "../../../components/ApyIndicator";

const createAccountsCount = ({ label }: { label: string }) => (
  <Text fontSize="12px" fontWeight="500" color="var(--colors-content-subdued-default-default)">
    {label}
  </Text>
);

const createAccountsCountAndApy = ({ label, value }: { label: string; value: number }) => (
  <>
    <Text fontSize="12px" fontWeight="500" color="var(--colors-content-subdued-default-default)">
      {label}
    </Text>
    <ApyIndicator value={value} type="APY" />
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
      const label = t("modularAssetDrawer.accountCount", { count: length });

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

  return accountData.map(({ asset, label, count }) => ({
    ...asset,
    leftElement: count > 0 ? createAccountsCountAndApy({ label, value }) : undefined,
    count,
  }));
};
