import React from "react";
import styled from "styled-components";
import type { Account } from "@ledgerhq/types-live";
import { Text, Flex, Icons } from "@ledgerhq/react-ui";
import Box from "~/renderer/components/Box";
import Spinner from "~/renderer/components/Spinner";
import { useAccountName } from "~/renderer/reducers/wallet";
import { ALEO_ACCOUNT_SHARING_STATUS, type AleoAccountSharingStatus } from "./domain";

interface AccountRowProps {
  account: Account;
  status: AleoAccountSharingStatus;
}

const AccountItem = styled(Flex)`
  padding: 12px 16px;
  border-radius: 8px;
  background: ${p => p.theme.colors.opacityDefault.c05};
  align-items: center;
  justify-content: space-between;
`;

const mapStatusToIcon: Record<AleoAccountSharingStatus, React.JSX.Element> = {
  [ALEO_ACCOUNT_SHARING_STATUS.CONFIRMED]: <Icons.Check size="S" color="neutral.c60" />,
  [ALEO_ACCOUNT_SHARING_STATUS.REJECTED]: <Icons.Close size="S" color="neutral.c60" />,
  [ALEO_ACCOUNT_SHARING_STATUS.WAITING]: <Icons.Refresh size="S" color="neutral.c60" />,
  [ALEO_ACCOUNT_SHARING_STATUS.PENDING]: (
    <Box size={20} justifyContent="center" alignItems="center">
      <Spinner size={14} />
    </Box>
  ),
};

export function ViewKeyConfirmationAccountRow({ account, status }: AccountRowProps) {
  const accountName = useAccountName(account);
  const statusIcon = mapStatusToIcon[status];

  return (
    <AccountItem data-testid="confirmation-account-row" data-status={status}>
      <Text fontSize={4} color="neutral.c80">
        {accountName}
      </Text>
      {statusIcon}
    </AccountItem>
  );
}
