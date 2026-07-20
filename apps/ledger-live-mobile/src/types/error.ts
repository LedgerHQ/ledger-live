import { LedgerErrorConstructor } from "@ledgerhq/errors";

export type LedgerError = InstanceType<LedgerErrorConstructor<{ [key: string]: unknown }>> & {
  name?: string;
  managerAppName?: string;
};
