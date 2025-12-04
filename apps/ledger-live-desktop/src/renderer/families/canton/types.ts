import React from "react";
import { Account, Operation } from "@ledgerhq/types-live";
import { StepProps as ReceiveStepProps } from "~/renderer/modals/Receive/Body";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/canton/types";
import { LLDCoinFamily } from "../types";

export type CantonFamily = LLDCoinFamily<Account, Transaction, TransactionStatus, Operation> & {
  StepReceiveFunds: React.ComponentType<ReceiveStepProps>;
  TooManyUtxosModal: React.ComponentType<{ account: Account }>;
  PendingTransferProposals: React.ComponentType<{
    account: Account;
  }>;
};
