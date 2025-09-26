import React, { useCallback, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { useTheme } from "styled-components";
import { Box, Flex } from "@ledgerhq/react-ui";
import { FormattedAccountItem } from "../../../components/FormattedAccountItem";
import { Account } from "@ledgerhq/types-live";
import { setDrawer } from "~/renderer/drawers/Provider";
import { AccountListProps } from "../types";

export const AccountList = ({
  accounts,
  formatAccount,
  navigateToEditAccountName,
  isAccountSelectionFlow,
}: AccountListProps) => {
  const { colors } = useTheme();
  const history = useHistory();

  const handleAccountClick = useCallback(
    (account: Account) => {
      if (isAccountSelectionFlow) {
        navigateToEditAccountName(account);
      } else {
        history.push({ pathname: `/account/${account.id}` });
        setDrawer();
      }
    },
    [history, isAccountSelectionFlow, navigateToEditAccountName],
  );

  const accountItems = useMemo(
    () =>
      accounts.map((account: Account) => {
        const formattedAccount = formatAccount(account);

        return (
          <Box mb={16} key={account.id}>
            <FormattedAccountItem
              aria-label={`account item ${account.id}`}
              account={formattedAccount}
              backgroundColor={colors.opacityDefault.c05}
              onClick={() => handleAccountClick(account)}
              rightElement={{
                type: isAccountSelectionFlow ? "arrow" : "edit",
                onClick: () => navigateToEditAccountName(account),
              }}
            />
          </Box>
        );
      }),
    [
      accounts,
      formatAccount,
      colors.opacityDefault.c05,
      navigateToEditAccountName,
      isAccountSelectionFlow,
      handleAccountClick,
    ],
  );

  return (
    <Flex
      flexDirection="column"
      mt={5}
      style={{
        overflowY: "auto",
        minHeight: 0,
        scrollbarWidth: "none",
      }}
    >
      {accountItems}
    </Flex>
  );
};
