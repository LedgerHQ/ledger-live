import type { ComponentType } from "react";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import generatedSendBalanceTypeSync from "~/generated/SendBalanceTypeSync";
import generatedSendAmountFooterRow from "~/generated/SendAmountFooterRow";

export type SendBalanceTypeSyncProps = Readonly<{
  account: Account;
  onComplete: () => void;
}>;

export type SendBalanceTypeSync = Readonly<{
  isRequired: (params: Readonly<{ account: Account; transaction: Transaction }>) => boolean;
  Component: ComponentType<SendBalanceTypeSyncProps>;
}>;

export type SendAmountFooterRowProps = Readonly<{
  account: Account;
  transaction: Transaction;
}>;

type FamilySlots<TSlot> = Readonly<Partial<Record<string, TSlot>>>;

const sendBalanceTypeSyncByFamily: FamilySlots<SendBalanceTypeSync> = generatedSendBalanceTypeSync;

export const sendAmountFooterRowByFamily: FamilySlots<ComponentType<SendAmountFooterRowProps>> =
  generatedSendAmountFooterRow;

export function getSendBalanceTypeSync(
  family: string | undefined,
): SendBalanceTypeSync | undefined {
  return family && Object.hasOwn(sendBalanceTypeSyncByFamily, family)
    ? sendBalanceTypeSyncByFamily[family]
    : undefined;
}

export function isSendBalanceTypeSyncRequired(
  account: Account,
  transaction: Transaction | null | undefined,
): boolean {
  if (!transaction) return false;
  return (
    getSendBalanceTypeSync(account.currency.family)?.isRequired({ account, transaction }) ?? false
  );
}
