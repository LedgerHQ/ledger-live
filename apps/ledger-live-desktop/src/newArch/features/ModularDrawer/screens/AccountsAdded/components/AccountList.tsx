import React, { useCallback, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { useTheme } from "styled-components";
import { Box, Flex } from "@ledgerhq/react-ui";
import { AccountItem } from "@ledgerhq/react-ui/pre-ldls/index";
import { Account } from "@ledgerhq/types-live";
import { setDrawer } from "~/renderer/drawers/Provider";
import { AccountListProps } from "../types";

export const AccountList = ({ accounts, formatAccount }: AccountListProps) => {
  const { colors } = useTheme();
  const history = useHistory();

  const handleAccountClick = useCallback(
    (accountId: string) => {
      history.push({ pathname: `/account/${accountId}` });
      setDrawer();
    },
    [history],
  );

  const accountItems = useMemo(
    () =>
      accounts.map((account: Account) => {
        const formattedAccount = formatAccount(account);

        return (
          <Box mb={16} key={account.id}>
            <AccountItem
              account={formattedAccount}
              rightElement={{ type: "arrow" }}
              onClick={() => handleAccountClick(account.id)}
              backgroundColor={colors.opacityDefault.c05}
            />
          </Box>
        );
      }),
    [accounts, formatAccount, colors.opacityDefault.c05, handleAccountClick],
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
