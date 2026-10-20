import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { Box, Flex } from "@ledgerhq/react-ui";
import { FormattedAccountItem } from "../../../components/FormattedAccountItem";
import { Account } from "@ledgerhq/types-live";
import { setDrawer } from "~/renderer/drawers/Provider";
import { AccountListProps } from "../types";
import { getAccountUrl } from "~/renderer/utils";

export const AccountList = ({
  accounts,
  formatAccount,
  navigateToEditAccountName,
  isAccountSelectionFlow,
}: AccountListProps) => {
  const navigate = useNavigate();

  const handleAccountClick = useCallback(
    (account: Account) => {
      if (isAccountSelectionFlow) {
        navigateToEditAccountName(account);
      } else {
        navigate(getAccountUrl(account.id));
        setDrawer();
      }
    },
    [navigate, isAccountSelectionFlow, navigateToEditAccountName],
  );

  const accountItems = useMemo(
    () =>
      accounts.map((account: Account) => {
        const formattedAccount = formatAccount(account);

        return (
          <Box mb={16} key={account.id}>
            <FormattedAccountItem
              account={formattedAccount}
              onClick={() => handleAccountClick(account)}
              onEdit={() => navigateToEditAccountName(account)}
              trailing={isAccountSelectionFlow ? "arrow" : "edit"}
            />
          </Box>
        );
      }),
    [
      accounts,
      formatAccount,
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
