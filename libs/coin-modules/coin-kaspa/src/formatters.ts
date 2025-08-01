import type { Unit } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import { KaspaAccount } from "./types/bridge";

function formatOperationSpecifics(op: Operation, unit: Unit | null | undefined): string {
  return "";
}

function formatAccountSpecifics(account: KaspaAccount): string {
  return "";
}

export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
};
