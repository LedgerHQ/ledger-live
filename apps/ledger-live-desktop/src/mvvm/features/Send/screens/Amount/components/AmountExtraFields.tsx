import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import type {
  AmountExtraField,
  AmountExtraFieldContext,
} from "@ledgerhq/live-common/bridge/descriptor/types";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
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
  fields: readonly AmountExtraField[];
}>;

/**
 * Generic, family-agnostic renderer for declarative Amount extra fields.
 *
 * The coin-module owns the options, the selected value and the resulting opaque
 * patch (via the descriptor). This component only renders a control and forwards
 * the user's choice — it never imports a coin-module or branches on family.
 */
export function AmountExtraFields({
  account,
  parentAccount,
  transaction,
  transactionActions,
  fields,
}: Props) {
  if (fields.length === 0) return null;

  return (
    <>
      {fields.map(field => (
        <AmountSelectFieldView
          key={field.id}
          field={field}
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          transactionActions={transactionActions}
        />
      ))}
    </>
  );
}

type FieldProps = Readonly<{
  field: AmountExtraField;
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  transactionActions: SendFlowTransactionActions;
}>;

function AmountSelectFieldView({
  field,
  account,
  parentAccount,
  transaction,
  transactionActions,
}: FieldProps) {
  const { t } = useTranslation();

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );

  const context = useMemo<AmountExtraFieldContext>(
    () => ({ mainAccount, transaction }),
    [mainAccount, transaction],
  );

  const options = useMemo(() => field.getOptions(context), [field, context]);
  const selectedId = field.getSelectedOptionId(context);

  const applyPatch = useCallback(
    (patch: Record<string, unknown> | null) => {
      if (!patch) return;
      transactionActions.updateTransaction(tx => ({ ...tx, ...patch }) as Transaction);
    },
    [transactionActions],
  );

  // Let the coin-module reset an invalid selection
  // Reconciliation logic stays in the descriptor.
  useEffect(() => {
    applyPatch(field.reconcile?.(context) ?? null);
  }, [field, context, applyPatch]);

  const onValueChange = useCallback(
    (optionId: string) => {
      applyPatch(field.buildPatch(optionId, context));
    },
    [field, context, applyPatch],
  );

  const selectedLabel = useMemo(
    () => options.find(option => option.id === selectedId)?.label ?? options[0]?.label ?? "",
    [options, selectedId],
  );

  return (
    <div className="flex flex-col gap-4">
      <span className="body-3 text-muted">{t(field.labelKey)}</span>
      <Menu>
        <MenuTrigger
          render={
            <ListItem
              className="cursor-pointer"
              data-testid={field.testId ? `${field.testId}-select` : undefined}
            >
              <ListItemLeading>
                <ListItemContent>
                  <ListItemTitle>{selectedLabel}</ListItemTitle>
                </ListItemContent>
              </ListItemLeading>
              <ListItemTrailing>
                <ChevronRight size={16} />
              </ListItemTrailing>
            </ListItem>
          }
        />
        <MenuContent className="pointer-events-auto" side="bottom" align="end">
          <MenuRadioGroup value={selectedId} onValueChange={onValueChange}>
            {options.map(option => (
              <MenuRadioItem
                key={option.id}
                value={option.id}
                closeOnClick
                className="cursor-pointer"
                data-testid={
                  field.testId ? `${field.testId}-option-${option.label.toLowerCase()}` : undefined
                }
              >
                {option.label}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuContent>
      </Menu>
    </div>
  );
}
