import { Account, Operation } from "@ledgerhq/types-live";
import { StepProps as CommonStepProps } from "~/renderer/modals/AddAccounts/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/canton/types";
import { LLDCoinFamily } from "../types";

export type CantonFamily = LLDCoinFamily<Account, Transaction, TransactionStatus, Operation> & {
  NoAssociatedAccounts: React.ComponentType<CommonStepProps>;
};
