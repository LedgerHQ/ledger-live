import React from "react";
import { Trans } from "react-i18next";
import { SubAccount } from "@ledgerhq/types-live";
import { Box, Alert, Text } from "@ledgerhq/native-ui";
import { isTokenAccountFrozen } from "@ledgerhq/live-common/families/solana/logic";
import { SolanaAccount, SolanaTokenAccount } from "@ledgerhq/live-common/families/solana/types";
import AccountSubHeader from "~/components/AccountSubHeader";

type Account = SolanaAccount | SolanaTokenAccount | SubAccount;

type Props = {
  account: Account;
};

function SolanaAccountSubHeader({ account }: Props) {
  return (
    <>
      {isTokenAccountFrozen(account) && (
        <Box mt={6}>
          <Alert type="warning">
            <Text variant="body">
              <Trans i18nKey="solana.token.frozenStateWarning" />
            </Text>
          </Alert>
        </Box>
      )}
      <AccountSubHeader family="Solana" team="Solana Labs" />
    </>
  );
}

export default SolanaAccountSubHeader;
