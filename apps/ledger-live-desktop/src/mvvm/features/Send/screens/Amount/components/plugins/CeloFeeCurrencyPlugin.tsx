import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as CeloTransaction } from "@ledgerhq/live-common/families/celo/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import {
  FEE_CURRENCY_BY_CONTRACT,
  FEE_CURRENCY_OPTIONS,
} from "@ledgerhq/live-common/families/celo/logic";
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";

type Props = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  transactionActions: SendFlowTransactionActions;
}>;

const NATIVE_CELO_ID = "celo";

function isCeloTransaction(tx: Transaction): tx is CeloTransaction {
  return tx.family === "celo";
}

function CeloFeeCurrencyPluginInner({
  account,
  parentAccount,
  transaction,
  transactionActions,
}: Props & { transaction: CeloTransaction }) {
  const { t } = useTranslation();

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );

  const tokenOptions: (TokenAccount & { feeCurrencyName: string })[] = useMemo(
    () =>
      (mainAccount.subAccounts ?? [])
        .filter((sub): sub is TokenAccount => sub.type === "TokenAccount")
        .filter(sub => new BigNumber(sub.balance).gt(0))
        .filter(sub => FEE_CURRENCY_BY_CONTRACT.has(sub.token.contractAddress.toLowerCase()))
        .map(sub => ({
          ...sub,
          feeCurrencyName:
            FEE_CURRENCY_BY_CONTRACT.get(sub.token.contractAddress.toLowerCase())?.name ??
            sub.token.name,
        })),
    [mainAccount.subAccounts],
  );

  const selectedId = transaction.feeCurrencyAccountId ?? NATIVE_CELO_ID;

  const selectedLabel = useMemo(() => {
    if (!transaction.feeCurrencyAccountId) return FEE_CURRENCY_OPTIONS[0].name;
    const found = tokenOptions.find(t => t.id === transaction.feeCurrencyAccountId);
    return found?.feeCurrencyName ?? FEE_CURRENCY_OPTIONS[0].name;
  }, [transaction.feeCurrencyAccountId, tokenOptions]);

  const onValueChange = useCallback(
    (id: string) => {
      if (id === NATIVE_CELO_ID) {
        transactionActions.updateTransaction(tx => ({
          ...tx,
          feeCurrency: null,
          feeCurrencyUnwrapped: null,
          feeCurrencyAccountId: null,
        }));
        return;
      }

      const tokenAccount = tokenOptions.find(t => t.id === id);
      if (!tokenAccount) return;

      const contractAddress = tokenAccount.token.contractAddress;
      const matchedOption = FEE_CURRENCY_BY_CONTRACT.get(contractAddress.toLowerCase());
      if (!matchedOption) return;

      const feeCurrency = matchedOption.adapterAddress ?? matchedOption.contractAddress ?? null;
      const feeCurrencyUnwrapped = matchedOption.contractAddress ?? null;

      transactionActions.updateTransaction(tx => ({
        ...tx,
        feeCurrency,
        feeCurrencyUnwrapped,
        feeCurrencyAccountId: tokenAccount.id,
      }));
    },
    [tokenOptions, transactionActions],
  );

  return (
    <div className="flex flex-col gap-4">
      <span className="body-3 text-muted">{t("send.steps.amount.feeCurrency")}</span>
      <Menu>
        <MenuTrigger asChild>
          <ListItem className="cursor-pointer" data-testid="send-celo-fee-currency-select">
            <ListItemLeading>
              <ListItemContent>
                <ListItemTitle>{selectedLabel}</ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
            <ListItemTrailing>
              <ChevronRight size={16} />
            </ListItemTrailing>
          </ListItem>
        </MenuTrigger>
        <MenuContent side="bottom" align="end">
          <MenuRadioGroup value={selectedId} onValueChange={onValueChange}>
            <MenuRadioItem
              value={NATIVE_CELO_ID}
              data-testid="send-celo-fee-currency-option-celo"
            >
              {FEE_CURRENCY_OPTIONS[0].name}
            </MenuRadioItem>
            {tokenOptions.map(tokenAccount => (
              <MenuRadioItem
                key={tokenAccount.id}
                value={tokenAccount.id}
                data-testid={`send-celo-fee-currency-option-${tokenAccount.feeCurrencyName.toLowerCase()}`}
              >
                {tokenAccount.feeCurrencyName}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuContent>
      </Menu>
    </div>
  );
}

export function CeloFeeCurrencyPlugin({
  account,
  parentAccount,
  transaction,
  transactionActions,
}: Props) {
  if (!isCeloTransaction(transaction)) return null;

  return (
    <CeloFeeCurrencyPluginInner
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      transactionActions={transactionActions}
    />
  );
}
