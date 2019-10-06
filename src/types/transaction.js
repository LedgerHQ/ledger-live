// @flow

import type { BigNumber } from "bignumber.js";
import type { Operation, OperationRaw } from "./operation";

export type SignAndBroadcastEvent =
  | { type: "signing" }
  | { type: "signed" }
  | { type: "broadcasted", operation: Operation };

export type SignAndBroadcastEventRaw =
  | { type: "signing" }
  | { type: "signed" }
  | { type: "broadcasted", operation: OperationRaw };

// Transaction is a generic object that holds all state for all transactions
// there are generic fields and coin specific fields. That's why almost all fields are optionals
export type TransactionCommon = {|
  amount: BigNumber,
  recipient: string,
  useAllAmount?: boolean,
  subAccountId?: ?string
|};

export type TransactionCommonRaw = {|
  amount: string,
  recipient: string,
  useAllAmount?: boolean,
  subAccountId?: ?string
|};

// TransactionStatus is a view of Transaction with general info to be used on the UI and status info.
export type TransactionStatus = {|
  // array of field based error messages for a transaction
  errors: { [string]: Error },
  // array of field based warning messages for a transaction
  warnings: { [string]: Error },
  // estimated total fees the tx is going to cost. (in the mainAccount currency)
  estimatedFees: BigNumber,
  // actual amount that the recipient will receive (in account currency)
  amount: BigNumber,
  // total amount that the sender will spend (in account currency)
  totalSpent: BigNumber,
  // should the recipient be non editable
  recipientIsReadOnly?: boolean
|};

export type TransactionStatusRaw = {|
  errors: { [string]: string },
  warnings: { [string]: string },
  estimatedFees: string,
  amount: string,
  totalSpent: string,
  useAllAmount?: boolean,
  recipientIsReadOnly?: boolean
|};
