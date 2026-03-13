import React, { useMemo, useState } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import { CeloFamily } from "../types";
import SelectAccount from "~/renderer/components/SelectAccount";
import { AccountLike, type TokenAccount } from "@ledgerhq/types-live";
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
    () => (acc: AccountLike) => {
      // Sub-accounts: only show tokens that are supported fee currencies
      if (isTokenAccount(acc)) {
        return FEE_CURRENCY_BY_CONTRACT.has(acc.token.contractAddress.toLowerCase());
      }

      return !(
        acc.currency.family.toUpperCase() !== "CELO" || acc.freshAddress !== account.freshAddress
      );
    },
    [account],
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
        />
      </Box>
    </Box>
  );
};

export default {
  component: SendRecipientFields,
  fields: ["feeCurrency", "feeCurrencyUnwrapped", "feeCurrencyAccountId"],
};
