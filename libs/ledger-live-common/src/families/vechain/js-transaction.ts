import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { DEFAULT_GAS_COEFFICIENT, HEX_PREFIX, MAINNET_CHAIN_TAG } from "./constants";
import { Transaction } from "./types";
import { Transaction as ThorTransaction } from "thor-devkit";
import { calculateTransactionInfo, generateNonce } from "./utils/transaction-utils";
import { VTHO_ADDRESS } from "./contracts/constants";
import VIP180 from "./contracts/abis/VIP180";
import { isValid } from "./utils/address-utils";
import { getBlockRef } from "./api";

/**
 * Create an empty VET or VTHO transaction
 *
 * @returns {Transaction}
 */
export const createTransaction = (): Transaction => {
  const chainTag = MAINNET_CHAIN_TAG;

  return {
    family: "vechain",
    body: {
      chainTag,
      blockRef: "0x0000000000000000",
      expiration: 18,
      clauses: [],
      gasPriceCoef: DEFAULT_GAS_COEFFICIENT,
      gas: "0",
      dependsOn: null,
      nonce: generateNonce(),
    },
    amount: BigNumber(0),
    estimatedFees: "0",
    recipient: "",
    useAllAmount: false,
  };
};

/**
 * Prepare transaction before checking status
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const prepareTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<Transaction> => {
  const { amount, isTokenAccount, estimatedFees, estimatedGas } = await calculateTransactionInfo(
    account,
    transaction,
  );

  let blockRef = "";

  let clauses: Array<ThorTransaction.Clause> = [];
  if (transaction.recipient && isValid(transaction.recipient)) {
    blockRef = await getBlockRef();
    if (isTokenAccount) {
      clauses = await calculateClausesVtho(transaction.recipient, amount);
    } else {
      clauses = await calculateClausesVet(transaction.recipient, amount);
    }
  }

  const body = { ...transaction.body, gas: estimatedGas, blockRef, clauses };
  return { ...transaction, body, amount, estimatedFees };
};

export const calculateClausesVtho = async (
  recipient: string,
  amount: BigNumber,
): Promise<ThorTransaction.Clause[]> => {
  const clauses: ThorTransaction.Clause[] = [];

  // Get the existing clause or create a blank one
  const updatedClause: ThorTransaction.Clause = {
    to: VTHO_ADDRESS,
    value: 0,
    data: "0x",
  };
  updatedClause.data = VIP180.transfer.encode(recipient, amount.toFixed());

  clauses.push(updatedClause);
  return clauses;
};

export const calculateClausesVet = async (
  recipient: string,
  amount: BigNumber,
): Promise<ThorTransaction.Clause[]> => {
  const clauses: ThorTransaction.Clause[] = [];

  // Get the existing clause or create a blank one
  const updatedClause: ThorTransaction.Clause = {
    to: null,
    value: 0,
    data: "0x",
  };

  updatedClause.value = `${HEX_PREFIX}${amount.toString(16)}`;
  updatedClause.to = recipient;

  clauses.push(updatedClause);

  return clauses;
};
