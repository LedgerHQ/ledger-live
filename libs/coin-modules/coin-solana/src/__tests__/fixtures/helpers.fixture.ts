import {
  AccountInfo,
  ParsedAccountData,
  ParsedTransactionMeta,
  ParsedTransactionWithMeta,
  PublicKey,
} from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { v4, v5, parse } from "uuid";
import { TokenAccountExtensions } from "../../network/chain/account/tokenExtensions";
import { Transaction } from "../../types";

const seed = v4();

export function publicKeyOf(str: string) {
  return new PublicKey(parse(v5(str, seed)));
}

export function parsedAccountInfo({
  lamports,
  owner,
  program,
  info,
  executable,
  type,
}: {
  lamports?: number;
  program: "stake" | "sysvar" | "spl-token" | "spl-token-2022";
  owner?: PublicKey;
  info?: unknown;
  executable?: boolean;
  type: "account" | "delegated" | "stakeHistory";
}): AccountInfo<ParsedAccountData> {
  return {
    executable: executable ?? false,
    owner: owner ?? publicKeyOf("owner"),
    lamports: lamports ?? 20,
    data: {
      program,
      parsed: { info, type },
      space: 200,
    },
  };
}

export function parsedStakeInfo({
  stakingCredit,
  authorized,
  delegation,
}: {
  stakingCredit: number;
  authorized: {
    staker: PublicKey;
    withdrawer: PublicKey;
  };
  delegation: {
    activationEpoch: string;
    deactivationEpoch: string;
    stake: string;
  };
}) {
  return {
    meta: {
      rentExemptReserve: new BigNumber(33000),
      authorized,
      lockup: {
        custodian: publicKeyOf(""),
        epoch: 0,
        unixTimestamp: 0,
      },
    },
    stake: {
      creditsObserved: stakingCredit,
      delegation: { ...delegation, voter: publicKeyOf("voter"), warmupCooldownRate: 0.25 },
    },
  };
}

export function parsedHistoryInfo({
  minEpoch,
  history,
}: {
  minEpoch: number;
  history: Array<{ activating: number; deactivating: number; effective: number }>;
}) {
  return history.map((entry, index) => ({
    epoch: minEpoch + index,
    stakeHistory: {
      activating: entry.activating,
      deactivating: entry.deactivating,
      effective: entry.effective,
    },
  }));
}

export function parsedTokenInfo({
  state,
  owner,
  mint,
  isNative,
  amount,
  decimals,
  extensions,
}: {
  state?: "initialized" | "uninitialized" | "frozen";
  owner?: PublicKey;
  mint?: PublicKey;
  isNative?: boolean;
  amount?: number;
  decimals?: number;
  extensions?: TokenAccountExtensions;
}) {
  const amountOrDefault = amount ?? 2000;
  const decimalsOrDefault = decimals ?? 3;
  const uiAmount = amountOrDefault / 10 ** decimalsOrDefault;
  return {
    isNative: !!isNative,
    owner: owner ?? publicKeyOf("owner"),
    mint: mint ?? publicKeyOf("mint"),
    state: state ?? "initialized",
    extensions: extensions ?? [],
    tokenAmount: {
      amount: amountOrDefault.toString(),
      decimals: decimalsOrDefault,
      uiAmount,
      uiAmountString: uiAmount.toFixed(decimalsOrDefault),
    },
  };
}

export function parsedTransaction({
  slot,
  meta,
  signature,
  blockTime,
}: {
  slot?: number;
  meta?: ParsedTransactionMeta;
  signature: string;
  blockTime?: Date;
}): ParsedTransactionWithMeta {
  return {
    blockTime: blockTime ? Math.floor(blockTime.getTime() / 1000) : NaN,
    slot: slot ?? 0,
    meta: meta ?? null,
    transaction: {
      signatures: [signature],
      message: { accountKeys: [], instructions: [], recentBlockhash: "" },
    },
  };
}

export function epochInfo({ epoch }: { epoch: number }) {
  return {
    absoluteSlot: 166598,
    blockHeight: 166500,
    epoch,
    slotIndex: 2790,
    slotsInEpoch: 8192,
    transactionCount: 22661093,
  };
}

export function transaction(options?: {
  kind?: Transaction["model"]["kind"];
  subAccountId?: string;
  raw?: string;
}): Transaction {
  const kind = options?.kind ?? "transfer";
  return {
    family: "solana",
    amount: new BigNumber(0),
    recipient: "",
    model: {
      kind,
      uiState: { subAccountId: options?.subAccountId, memo: "random memo for unit test" },
      commandDescriptor: {
        command: {
          kind,
          sender: "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp",
          recipient: "DwRL6XkPAtM1bfuySJKZGn2t9WeG25RC39isAu2nwak4",
          amount: 0,
        },
        fee: 0,
        warnings: {},
        errors: {},
      },
    },
    raw: options?.raw ?? "",
  } as unknown as Transaction;
}
