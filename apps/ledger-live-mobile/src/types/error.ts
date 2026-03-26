import { LedgerErrorConstructor } from "@ledgerhq/errors/helpers";

export type LedgerError = InstanceType<LedgerErrorConstructor<{ [key: string]: unknown }>> & {
  name?: string;
  managerAppName?: string;
};
