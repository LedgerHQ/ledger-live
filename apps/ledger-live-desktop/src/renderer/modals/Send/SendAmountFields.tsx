import React from "react";
import { Account, FeeStrategy, Operation, TransactionCommonRaw } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getLLDCoinFamily } from "~/renderer/families";
import BigNumber from "bignumber.js";

type Props = {
  account: Account;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  updateTransaction: (updater: (_: Transaction) => Transaction) => void;
  mapStrategies?: (a: FeeStrategy) => FeeStrategy;
  bridgePending?: boolean;
  trackProperties?: Record<string, unknown>;
  // FIXME: shity typing
  minFees?: {
    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
    gasPrice?: BigNumber;
  };
  // TODO: is it used anywhere? to remove?
  transactionRaw?: TransactionCommonRaw;
};

const AmountRelatedField = (props: Props) => {
  const module = getLLDCoinFamily<Account, Transaction, TransactionStatus, Operation>(
    props.account.currency.family,
  )?.sendAmountFields;
  if (!module) return null;
  const Cmp = module.component;
  return <Cmp {...props} />;
};

export default AmountRelatedField;
