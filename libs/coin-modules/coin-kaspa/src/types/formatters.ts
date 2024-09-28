import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { KaspaAccount, KaspaOperation } from "./bridge";

function formatOperationSpecifics(op: KaspaOperation, unit: Unit | null | undefined): string {
  return "no extras in Kaspa";
}

function formatAccountSpecifics(account: KaspaAccount): string {
  return "no specific Kaspa things here yet.";
}

export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
};
