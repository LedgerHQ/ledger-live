import React, { useMemo, useState } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import type { CeloFamily } from "../types";
import SelectAccount from "~/renderer/components/SelectAccount";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { findSubAccountById, isTokenAccount } from "@ledgerhq/ledger-wallet-framework/account";
import { FEE_CURRENCY_BY_CONTRACT } from "@ledgerhq/live-common/families/celo/logic";

const SendRecipientFields: NonNullable<CeloFamily["sendRecipientFields"]>["component"] = ({
  transaction,
  onChange,
  account,
}) => {
  const [feeAccount, setFeeAccount] = useState<AccountLike | null | undefined>(
    findSubAccountById(account, transaction.feeCurrencyAccountId ?? ""),
  );

  const accountFilter = useMemo(
    () => (acc: Account) =>
      !(acc.currency.family.toUpperCase() !== "CELO" || acc.freshAddress !== account.freshAddress),
    [account],
  );

  const subAccountFilter = useMemo(
    () => (subAccount: TokenAccount) =>
      FEE_CURRENCY_BY_CONTRACT.has(subAccount.token.contractAddress.toLowerCase()),
    [],
  );

  const onChangeAccount = useMemo(() => {
    return (feeAccount: AccountLike | null | undefined) => {
      setFeeAccount(feeAccount ?? null);

      // No selection → reset to native CELO fees
      if (!feeAccount || !isTokenAccount(feeAccount)) {
        onChange({
          ...transaction,
          feeCurrency: null,
          feeCurrencyUnwrapped: null,
          feeCurrencyAccountId: null,
        });
        return;
      }

      // Check if it's a token account and get contract address
      const contractAddress = feeAccount.token.contractAddress;
      const feeCurrencyAccount: TokenAccount = feeAccount;

      const matchedOption = FEE_CURRENCY_BY_CONTRACT.get(contractAddress.toLowerCase());

      // Guard: token not in the allowlist — reset to native CELO fees
      if (!matchedOption) {
        onChange({
          ...transaction,
          feeCurrency: null,
          feeCurrencyUnwrapped: null,
          feeCurrencyAccountId: null,
        });
        return;
      }

      // Use adapterAddress if present, otherwise use contractAddress
      const feeCurrency = matchedOption.adapterAddress || matchedOption.contractAddress || null;
      const feeCurrencyUnwrapped = matchedOption.contractAddress || null;

      onChange({
        ...transaction,
        feeCurrency,
        feeCurrencyUnwrapped,
        feeCurrencyAccountId: feeCurrencyAccount.id,
      });
    };
  }, [onChange, transaction]);

  return (
    <Box flow={1}>
      <Box flow={1}>
        <Label>
          <Trans i18nKey="send.steps.amount.feeCurrency" />
        </Label>
        <SelectAccount
          id="account-fee-currency-placeholder"
          withSubAccounts
          enforceHideEmptySubAccounts
          onChange={onChangeAccount}
          value={feeAccount}
          filter={accountFilter}
          subAccountFilter={subAccountFilter}
        />
      </Box>
    </Box>
  );
};

export default {
  component: SendRecipientFields,
  fields: ["feeCurrency", "feeCurrencyUnwrapped", "feeCurrencyAccountId"],
};
