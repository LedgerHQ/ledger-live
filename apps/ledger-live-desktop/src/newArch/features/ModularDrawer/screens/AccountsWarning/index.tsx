import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { WARNING_REASON } from "../../types";
import { ActionButtons, IconContainer } from "./components";
import { useWarningConfig } from "./useWarningConfig";
import { AccountsWarningProps } from "./types";
import { TrackAddAccountScreen } from "../../analytics/TrackAddAccountScreen";
import { ADD_ACCOUNT_PAGE_NAME } from "../../analytics/addAccount.types";

const AccountsWarning = ({
  warningReason,
  currency,
  emptyAccount,
  navigateToEditAccountName,
  navigateToFundAccount,
  source,
}: AccountsWarningProps) => {
  const { emptyAccountWarning, noAssociatedAccountsWarning } = useWarningConfig(
    currency,
    navigateToEditAccountName,
    navigateToFundAccount,
    emptyAccount,
  );

  const warning =
    warningReason === WARNING_REASON.NO_ASSOCIATED_ACCOUNTS
      ? noAssociatedAccountsWarning
      : emptyAccountWarning;

  return (
    <Flex flexDirection="column" height="100%" alignItems="center">
      <TrackAddAccountScreen
        page={ADD_ACCOUNT_PAGE_NAME.CANT_ADD_NEW_ACCOUNT}
        source={source}
        reason={warningReason}
      />
      <Flex flexDirection="column" alignItems="center" flexShrink={0} width={420}>
        <IconContainer icon={warning.icon} />
        <Text
          fontSize={24}
          textAlign="center"
          fontWeight="semiBold"
          color="palette.text.shade100"
          data-testid="accounts-added-title"
          marginBottom={16}
        >
          {warning.title}
        </Text>
        <Text mb={32} textAlign="center" variant="body" fontSize={14} color="neutral.c70">
          {warning.description}
        </Text>
      </Flex>
      {warning.accountRow}
      <ActionButtons
        primaryAction={warning.primaryAction}
        secondaryAction={warning.secondaryAction}
      />
    </Flex>
  );
};

export default AccountsWarning;
