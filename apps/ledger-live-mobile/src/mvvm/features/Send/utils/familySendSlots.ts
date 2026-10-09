import type { ComponentType } from "react";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import generatedSendBalanceTypeSync from "~/generated/SendBalanceTypeSync";
import generatedSendAmountFooterRow from "~/generated/SendAmountFooterRow";

export type SendBalanceTypeSyncProps = Readonly<{
  account: Account;
  transaction: Transaction;
  onComplete: () => void;
}>;

export type SendAmountFooterRowProps = Readonly<{
  account: Account;
  transaction: Transaction;
}>;

type FamilySlots<TProps> = Readonly<Partial<Record<string, ComponentType<TProps>>>>;

export const sendBalanceTypeSyncByFamily: FamilySlots<SendBalanceTypeSyncProps> =
  generatedSendBalanceTypeSync;

export const sendAmountFooterRowByFamily: FamilySlots<SendAmountFooterRowProps> =
  generatedSendAmountFooterRow;

export function hasSendBalanceTypeSync(family: string | undefined): boolean {
  return Boolean(family && Object.hasOwn(sendBalanceTypeSyncByFamily, family));
}
