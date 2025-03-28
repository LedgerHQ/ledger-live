import React from "react";
import { Trans } from "react-i18next";
import { TokenAccount } from "@ledgerhq/types-live";
import { Box, Alert, Text } from "@ledgerhq/native-ui";
import {
  getTokenExtensions,
  isTokenAccountFrozen,
} from "@ledgerhq/live-common/families/solana/token";
import { SolanaAccount, SolanaTokenAccount } from "@ledgerhq/live-common/families/solana/types";
import AccountSubHeader from "~/components/AccountSubHeader";
import TokenExtensionsInfoBox from "./Token2022/TokenExtensionsInfoBox";

type Account = SolanaAccount | SolanaTokenAccount | TokenAccount;

type Props = {
  account: Account;
};

function SolanaAccountSubHeader({ account }: Props) {
  const tokenExtensions = getTokenExtensions(account);
  return (
    <>
      <AccountSubHeader family="Solana" team="Solana Labs" />
      {isTokenAccountFrozen(account) && (
        <Box mb={6}>
          <Alert type="warning">
            <Text variant="body">
              <Trans i18nKey="solana.token.frozenStateWarning" />
            </Text>
          </Alert>
        </Box>
      )}
      {!!tokenExtensions && (
        <TokenExtensionsInfoBox
          tokenAccount={account as SolanaTokenAccount}
          extensions={tokenExtensions}
        />
      )}
    </>
  );
}

export default SolanaAccountSubHeader;
