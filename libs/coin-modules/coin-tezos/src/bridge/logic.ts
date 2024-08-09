import blake2b from "blake2b";
import bs58check from "bs58check";
import BigNumber from "bignumber.js";
import { OperationType } from "@ledgerhq/types-live";
import { decodeAccountId } from "@ledgerhq/coin-framework/account";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { type APIOperation } from "../network/types";
import { TezosAccount, TezosOperation } from "../types";

export const txToOp =
  ({ address, accountId }: { address: string; accountId: string }) =>
  (tx: APIOperation): TezosOperation | null | undefined => {
    let type: OperationType;
    let maybeValue;
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

export function reconciliatePublicKey(
  publicKey: string | undefined,
  account: TezosAccount | undefined,
): string {
  if (publicKey) return publicKey;
  if (account) {
    const { xpubOrAddress } = decodeAccountId(account.id);
    return xpubOrAddress;
  }
  throw new Error("publicKey wasn't properly restored");
}

export function encodeAddress(publicKey: Buffer) {
  const curve = 0;
  const curveData = {
    pkB58Prefix: Buffer.from([13, 15, 37, 217]),
    pkhB58Prefix: Buffer.from([6, 161, 159]),
    compressPublicKey: (publicKey: Buffer, curve: number) => {
      publicKey = publicKey.slice(0);
      publicKey[0] = curve;
      return publicKey;
    },
  };
  const publicKeyBuf = curveData.compressPublicKey(publicKey, curve);
  const key = publicKeyBuf.slice(1);
  const keyHashSize = 20;
  // eslint-disable-next-line prefer-const
  const hash = Buffer.alloc(keyHashSize);
  const blakHash = blake2b(keyHashSize);
  blakHash.update(key);
  blakHash.digest(hash);
  const address = bs58check.encode(Buffer.concat([curveData.pkhB58Prefix, hash]));
  return address;
}

export function isStringHex(s: string): boolean {
  for (let i = 0; i < s.length; i += 2) {
    const ss = s.slice(i, i + 2);
    const x = parseInt(ss, 16);
    if (Number.isNaN(x)) {
      return false;
    }
  }
  return true;
}
