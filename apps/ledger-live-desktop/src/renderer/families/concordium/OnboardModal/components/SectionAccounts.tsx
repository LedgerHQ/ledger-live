import React from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { getDefaultAccountNameForCurrencyIndex } from "@ledgerhq/live-wallet/accountName";
import Box from "~/renderer/components/Box";
import AccountRow from "~/renderer/components/AccountsList/AccountRow";
import { StepProps } from "../types";

type SectionAccountsProps = Pick<
  StepProps,
  "currency" | "accountName" | "editedNames" | "creatableAccount" | "importableAccounts"
> & {
  showImportableAccounts?: boolean;
};

export const SectionAccounts = ({
  currency,
  accountName,
  editedNames,
  creatableAccount,
  importableAccounts,
  showImportableAccounts = false,
}: SectionAccountsProps) => {
  return (
    <SectionAccountsStyled>
      {showImportableAccounts && importableAccounts?.length > 0 && (
        <Box mb={4}>
          <Box
            horizontal
            ff="Inter|Bold"
            color="palette.text.shade100"
            fontSize={2}
            textTransform="uppercase"
            mb={3}
          >
            <Trans
              i18nKey="families.concordium.addAccount.identity.onboarded"
              count={importableAccounts?.length}
            />
          </Box>
          <Box flow={2}>
            {importableAccounts.map((account, index) => (
              <AccountRow
                key={account.id}
                account={account}
                accountName={
                  editedNames[account.id] ||
                  getDefaultAccountNameForCurrencyIndex({ currency, index })
                }
                isDisabled={false}
                hideAmount={false}
                isReadonly={true}
              />
            ))}
          </Box>
        </Box>
      )}

      <Box mb={4}>
        <Box
          horizontal
          ff="Inter|Bold"
          color="palette.text.shade100"
          fontSize={2}
          textTransform="uppercase"
          mb={3}
        >
          <Trans i18nKey="families.concordium.addAccount.identity.newAccount" />
        </Box>
        {creatableAccount && (
          <AccountRow
            account={creatableAccount}
            accountName={accountName}
            isDisabled={false}
            hideAmount={true}
            isReadonly={true}
          />
        )}
      </Box>
    </SectionAccountsStyled>
  );
};

const SectionAccountsStyled = styled(Box)`
  position: relative;
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
`;
