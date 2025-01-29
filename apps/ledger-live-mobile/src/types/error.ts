import { LedgerErrorConstructor } from "@ledgerhq/errors/lib/helpers";

export type LedgerError = InstanceType<LedgerErrorConstructor<{ [key: string]: unknown }>> & {
  name?: string;
  managerAppName?: string;
};
