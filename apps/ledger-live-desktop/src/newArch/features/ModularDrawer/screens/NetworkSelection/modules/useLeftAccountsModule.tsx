import React from "react";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Text } from "@ledgerhq/react-ui/index";
import { getAccountTuplesForCurrency } from "../../../utils/getAccountTuplesForCurrency";
import { useTranslation } from "react-i18next";
import { Network } from "@ledgerhq/react-ui/pre-ldls/index";

const createAccountsCount = ({ label }: { label: string }) => (
  <Text fontSize="12px" fontWeight="500" color="var(--colors-content-subdued-default-default)">
    {label}
  </Text>
);

type NetworkWithCount = Network & {
  count: number;
};

export const useLeftAccountsModule = (assets: CryptoOrTokenCurrency[]) => {
  const { t } = useTranslation();
  const nestedAccounts = useSelector(accountsSelector);

  const networksWithCount: NetworkWithCount[] = assets
    .map(asset => {
      const { length } = getAccountTuplesForCurrency(asset, nestedAccounts);

      if (length === 0) {
        return { ...asset, count: 0 };
      }

      const label = t("modularAssetDrawer.accountCount", { count: length });

      return {
        ...asset,
        leftElement: createAccountsCount({ label }),
        count: length,
      };
    })
    .sort((a, b) => {
      return b.count - a.count;
    });

  return networksWithCount;
};
