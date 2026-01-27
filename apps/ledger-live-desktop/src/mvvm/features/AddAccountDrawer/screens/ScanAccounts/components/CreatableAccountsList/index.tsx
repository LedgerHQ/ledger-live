import { Box, Flex, Icons, Text } from "@ledgerhq/react-ui";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { useTranslation } from "react-i18next";
import Switch from "~/renderer/components/Switch";
import ToolTip from "~/renderer/components/Tooltip";

export type CreatableAccountsListProps = {
  currency: CryptoCurrency;
  newAccountSchemes: string[];
  creatableAccounts: Account[];
  showAllCreatedAccounts: boolean;
  toggleShowAllCreatedAccounts: () => void;
  renderAccount: (account: Account) => React.ReactNode;
  titleKey?: string;
};

export const CreatableAccountsList = ({
  currency,
  newAccountSchemes,
  creatableAccounts,
  showAllCreatedAccounts,
  toggleShowAllCreatedAccounts,
  renderAccount,
  titleKey = "modularAssetDrawer.addAccounts.newAccount",
}: CreatableAccountsListProps) => {
  const { t } = useTranslation();

  return (
    <Box flex={1}>
      <Flex alignItems="center" justifyContent="space-between" mb="2">
        <Text variant="h5Inter" fontSize="small" color="neutral.c80">
          {t(titleKey)}
        </Text>
        {newAccountSchemes.length > 1 ? (
          <Flex flexDirection="row" alignItems="center" justifyContent="center">
            <Text variant="h5Inter" fontSize="small">
              {t("addAccounts.createNewAccount.showAllAddressTypes")}
            </Text>
            <ToolTip
              content={
                <Text variant="h5Inter" fontSize="small" color="neutral.c00">
                  {t("addAccounts.createNewAccount.showAllAddressTypesTooltip", {
                    family: currency.name,
                  })}
                </Text>
              }
            >
              <Flex mx={1} alignItems="center" justifyContent="center">
                <Icons.Information size={"XS"} />
              </Flex>
            </ToolTip>
            <Switch
              isChecked={showAllCreatedAccounts}
              onChange={() => toggleShowAllCreatedAccounts()}
            />
          </Flex>
        ) : null}
      </Flex>

      <Box>{creatableAccounts.map(renderAccount)}</Box>
    </Box>
  );
};
