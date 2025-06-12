import React from "react";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Text } from "@ledgerhq/react-ui/index";
import { getAccountTuplesForCurrency } from "~/renderer/components/PerCurrencySelectAccount/state";
import { useTranslation } from "react-i18next";

const createAccountsCount = ({ label }: { label: string }) => (
  <Text fontSize="12px" fontWeight="500" color="var(--colors-content-subdued-default-default)">
    {label}
  </Text>
);

export const useLeftAccountsModule = (assets: CryptoOrTokenCurrency[]) => {
  const { t } = useTranslation();
  const nestedAccounts = useSelector(accountsSelector);

  return assets.map(asset => {
    const { length } = getAccountTuplesForCurrency(asset, nestedAccounts, false);

    if (length === 0) {
      return asset;
    }

    const label = t("modularAssetDrawer.accountCount", { count: length });

    return {
      ...asset,
      leftElement: createAccountsCount({ label }),
    };
  });
};
