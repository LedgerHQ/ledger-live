import type { ComponentType } from "react";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import generatedSendAccountSync from "~/generated/SendAccountSync";
import generatedSendAmountFooterRow from "~/generated/SendAmountFooterRow";

export type SendAccountSyncProps = Readonly<{
  account: Account;
  onComplete: () => void;
}>;

export type SendAccountSync = Readonly<{
  isRequired: (params: Readonly<{ account: Account; transaction: Transaction }>) => boolean;
  Component: ComponentType<SendAccountSyncProps>;
}>;

export type SendAmountFooterRowProps = Readonly<{
  account: Account;
  transaction: Transaction;
}>;

type FamilySlots<TSlot> = Readonly<Partial<Record<string, TSlot>>>;

const sendAccountSyncByFamily: FamilySlots<SendAccountSync> = generatedSendAccountSync;

export const sendAmountFooterRowByFamily: FamilySlots<ComponentType<SendAmountFooterRowProps>> =
  generatedSendAmountFooterRow;

export function getSendAccountSync(family: string | undefined): SendAccountSync | undefined {
  return family && Object.hasOwn(sendAccountSyncByFamily, family)
    ? sendAccountSyncByFamily[family]
    : undefined;
}

export function isSendAccountSyncRequired(
  account: Account,
  transaction: Transaction | null | undefined,
): boolean {
  if (!transaction) return false;
  return getSendAccountSync(account.currency.family)?.isRequired({ account, transaction }) ?? false;
}
