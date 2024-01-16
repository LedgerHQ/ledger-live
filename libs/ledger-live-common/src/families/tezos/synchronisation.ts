// @flow
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import bs58check from "bs58check";
import blake2b from "blake2b";
import { encodeAccountId } from "../../account";
import { mergeOps } from "../../bridge/jsHelpers";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { encodeOperationId } from "../../operation";
import { areAllOperationsLoaded, decodeAccountId } from "../../account";
import type { Account, OperationType } from "@ledgerhq/types-live";
import api from "./api/tzkt";
import type { APIOperation } from "./api/tzkt";
import { TezosOperation } from "./types";
import { getEnv } from "@ledgerhq/live-env";

function reconciliatePublicKey(
  publicKey: string | undefined,
  initialAccount: Account | undefined,
): string {
  if (publicKey) return publicKey;
  if (initialAccount) {
    const { xpubOrAddress } = decodeAccountId(initialAccount.id);
    return xpubOrAddress;
  }
  throw new Error("publicKey wasn't properly restored");
}

const encodeAddress = (publicKey: Buffer) => {
  const curve = 0;
  const curveData = {
    pkB58Prefix: Buffer.from([13, 15, 37, 217]),
    pkhB58Prefix: Buffer.from([6, 161, 159]),
    compressPublicKey: (publicKey: Buffer, curve) => {
      publicKey = publicKey.slice(0);
      publicKey[0] = curve;
      return publicKey;
    },
  };
  const publicKeyBuf = curveData.compressPublicKey(publicKey, curve);
  const key = publicKeyBuf.slice(1);
  const keyHashSize = 20;
  let hash = blake2b(keyHashSize);
  hash.update(key);
  hash.digest((hash = Buffer.alloc(keyHashSize)));
  const address = bs58check.encode(Buffer.concat([curveData.pkhB58Prefix, hash]));
  return address;
};

function isStringHex(s: string): boolean {
  for (let i = 0; i < s.length; i += 2) {
    const ss = s.slice(i, i + 2);
    const x = parseInt(ss, 16);
    if (Number.isNaN(x)) {
      return false;
    }
  }
  return true;
}

export const getAccountShape: GetAccountShape = async infoInput => {
  const { initialAccount, rest, currency, derivationMode } = infoInput;
  const publicKey = reconciliatePublicKey(rest?.publicKey, initialAccount);
  invariant(isStringHex(publicKey), "Please reimport your Tezos accounts");
  const hex = Buffer.from(publicKey, "hex");
  const address = encodeAddress(hex);

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: publicKey,
    derivationMode,
  });

  const initialStableOperations = (
    initialAccount && initialAccount.id === accountId ? initialAccount.operations : []
  ) as TezosOperation[];

  // fetch transactions, incrementally if possible
  const mostRecentStableOperation = initialStableOperations[0];

  const lastId =
    initialAccount && areAllOperationsLoaded(initialAccount) && mostRecentStableOperation
      ? mostRecentStableOperation.extra.id || undefined
      : undefined;

  const apiAccountPromise = api.getAccountByAddress(address);
  const blocksCountPromise = api.getBlockCount();

  const [apiAccount, blockHeight] = await Promise.all([apiAccountPromise, blocksCountPromise]);

  if (apiAccount.type === "empty") {
    return {
      id: accountId,
      xpub: publicKey,
      freshAddress: address,
      blockHeight,
      lastSyncDate: new Date(),
      tezosResources: {
        revealed: false,
        counter: 0,
      },
    };
  }

  const fullySupported = apiAccount.type === "user";

  const apiOperations = fullySupported ? await fetchAllTransactions(address, lastId) : [];

  const { revealed, counter } = apiAccount;

  const tezosResources = {
    revealed,
    counter,
  };

  const balance = new BigNumber(apiAccount.balance);
  const subAccounts = [];

  const newOps: any[] = apiOperations.map(txToOp({ address, accountId })).filter(Boolean);

  const operations = mergeOps(initialStableOperations, newOps);

  const accountShape = {
    id: accountId,
    xpub: publicKey,
    freshAddress: address,
    operations,
    balance,
    subAccounts,
    spendableBalance: balance,
    blockHeight,
    lastSyncDate: new Date(),
    tezosResources,
  };

  return accountShape;
};

const txToOp =
  ({ address, accountId }) =>
  (tx: APIOperation): TezosOperation | null | undefined => {
    let type: OperationType;
    let maybeValue = new BigNumber(0);
    let senders: string[] = [];
    let recipients: string[] = [];
    const hasFailed = tx.status ? tx.status !== "applied" : false;

    switch (tx.type) {
      case "transaction": {
        const initiator = tx.initiator?.address;
        const from = tx.sender?.address;
        const to = tx.target?.address;
        if (from !== address && to !== address && initiator !== address) {
          // failsafe for a case that shouldn't happen.
          console.warn("found tx is unrelated to account! " + tx.hash);
          return null;
        }
        senders = [from || initiator || ""];
        recipients = [to || ""];
        if (
          (from === address && to === address) || // self tx
          (from !== address && to !== address) // initiator but not in from/to
        ) {
          // we just pay fees in that case
          type = "FEES";
        } else {
          type = to === address ? "IN" : "OUT";
          if (!hasFailed) {
            maybeValue = new BigNumber(tx.amount || 0);
            if (maybeValue.eq(0)) {
              type = "FEES";
            }
          }
        }
        break;
      }
      case "delegation":
        type = tx.newDelegate ? "DELEGATE" : "UNDELEGATE";
        senders = [address];
        // convention was to use recipient for the new delegation address or "" if undelegation
        recipients = [tx.newDelegate ? tx.newDelegate.address : ""];
        break;
      case "reveal":
        type = "REVEAL";
        senders = [address];
        recipients = [address];
        break;
      case "migration":
        type = tx.balanceChange < 0 ? "OUT" : "IN";
        maybeValue = new BigNumber(Math.abs(tx.balanceChange || 0));
        senders = [address];
        recipients = [address];
        break;
      case "origination":
        type = "CREATE";
        maybeValue = new BigNumber(tx.contractBalance || 0);
        senders = [address];
        recipients = [tx.originatedContract?.address || ""];
        break;
      case "activation":
        type = "IN";
        senders = [address];
        recipients = [address];
        maybeValue = new BigNumber(tx.balance || 0);
        break;
      // TODO more type of tx
      default:
        console.warn("unsupported tx:", tx);
        return null;
    }

    let { hash } = tx;
    const {
      id,
      allocationFee,
      bakerFee,
      storageFee,
      level: blockHeight,
      block: blockHash,
      timestamp,
    } = tx;

    if (!hash) {
      // in migration case, there is no hash...
      hash = "";
    }

    let value = maybeValue || new BigNumber(0);
    if (type === "IN" && value.eq(0)) {
      return; // not interesting op
    }

    let fee = new BigNumber(bakerFee || 0);

    if (!hasFailed) {
      fee = fee.plus(allocationFee || 0).plus(storageFee || 0);
    }

    if (type !== "IN") {
      value = value.plus(fee);
    }

    return {
      id: encodeOperationId(accountId, hash, type),
      hash,
      type,
      value,
      fee,
      senders,
      recipients,
      blockHeight,
      blockHash,
      accountId,
      date: new Date(timestamp),
      extra: { id },
      hasFailed,
    };
  };

export const fetchAllTransactions = async (
  address: string,
  lastId?: number,
): Promise<APIOperation[]> => {
  let txs: APIOperation[] = [];
  let maxIteration = getEnv("TEZOS_MAX_TX_QUERIES");
  do {
    const r = await api.getAccountOperations(address, { lastId, sort: 0 });
    if (r.length === 0) return txs;
    txs = txs.concat(r);
    const last = txs[txs.length - 1];
    if (!last) return txs;
    lastId = last.id;
    if (!lastId) {
      log("tezos", "id missing!");
      return txs;
    }
  } while (--maxIteration);
  return txs;
};
