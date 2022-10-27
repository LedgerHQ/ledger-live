import type { Account, AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";

import { getAccountShape } from "../utils";
import { AccessRights, CLPublicKey, CLURef, DeployUtil } from "casper-js-sdk";
import BigNumber from "bignumber.js";
import { getPurseURef } from "./utils/network";
import { getAddress, getPublicKey } from "./utils/msc";
import { CASPER_FEES } from "../consts";

const receive = makeAccountBridgeReceive();

const createTransaction = (a: Account): Transaction => {
  // log("debug", "[createTransaction] creating base tx");

  const deployParams = new DeployUtil.DeployParams(
    new CLPublicKey(Buffer.from(getPublicKey(a), "hex"), 2),
    "main-network"
  );
  const session = DeployUtil.ExecutableDeployItem.newTransfer(
    0,
    new CLURef(Buffer.alloc(32), 0),
    undefined,
    1
  );

  const payment = DeployUtil.standardPayment(CASPER_FEES);
  const deploy = DeployUtil.makeDeploy(deployParams, session, payment);

  return { deploy, amount: new BigNumber(0), recipient: "" };
};

const updateTransaction = (t: Transaction, patch: Transaction): Transaction => {
  // log("debug", "[updateTransaction] patching tx");

  return { ...t, ...patch };
};

const prepareTransaction = () => {
  throw new Error("prepareTransaction not implemented");
};

const updateTransaction = () => {
  throw new Error("updateTransaction not implemented");
};

const getTransactionStatus = () => {
  throw new Error("getTransactionStatus not implemented");
};

const estimateMaxSpendable = () => {
  throw new Error("estimateMaxSpendable not implemented");
};

const signOperation = () => {
  throw new Error("signOperation not implemented");
};

const broadcast = () => {
  throw new Error("broadcast not implemented");
};

const sync = makeSync({ getAccountShape });

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast,
};

export { accountBridge };
