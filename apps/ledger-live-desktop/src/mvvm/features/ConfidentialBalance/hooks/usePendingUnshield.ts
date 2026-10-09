import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ConfidentialPair, PendingUnshield } from "@ledgerhq/coin-evm/confidential";
import { confidentialApi } from "../utils/confidentialApi";
import {
  createConfidentialContext,
  getSepoliaRpcUrl,
  type CreateConfidentialClient,
} from "../utils/confidentialRuntime";
import {
  getConfidentialErrorKind,
  type ConfidentialErrorKind,
} from "../utils/getConfidentialErrorKind";
import {
  clearSessionUnshield,
  getSessionUnshield,
  setSessionUnshield,
  subscribeSessionUnshields,
} from "../utils/sessionUnshields";
import {
  createDeviceTransactionExecutor,
  getReceipt,
  type RpcReceipt,
  type SignTransaction,
} from "../utils/deviceTransactionExecutor";

export const UNSHIELD_POLL_MS = 10_000;
export const UNSHIELD_REQUIRED_CONFIRMATIONS = 2;

export type PendingUnshieldStatus =
  | { status: "awaiting-request" }
  | { status: "awaiting-confirmations"; confirmations: number; required: number }
  | { status: "awaiting-decryption" }
  | { status: "ready" }
  | { status: "finalizing" }
  | { status: "failed"; error: ConfidentialErrorKind };

type Props = {
  tokenAccountId: string;
  currencyId: string;
  pair: ConfidentialPair | undefined;
  createConfidentialClient: CreateConfidentialClient;
  signTransaction: SignTransaction;
  onFinalized: () => void;
};

function toReceipt(receipt: RpcReceipt) {
  return {
    transactionHash: receipt.transactionHash,
    blockNumber: Number(receipt.blockNumber),
    from: receipt.from,
    status: receipt.status,
    logs: receipt.logs,
  };
}

/**
 * Follows the unshield signed from the send flow for this token account: phase 1 mined and confirmed,
 * then the burnt amount publicly decryptable, then the finalize the user signs on the device.
 */
export function usePendingUnshield({
  tokenAccountId,
  currencyId,
  pair,
  createConfidentialClient,
  signTransaction,
  onFinalized,
}: Props) {
  const entry = useSyncExternalStore(subscribeSessionUnshields, () =>
    getSessionUnshield(tokenAccountId),
  );
  const [view, setView] = useState<PendingUnshieldStatus>({ status: "awaiting-request" });
  const isFinalizing = useRef(false);

  const poll = useCallback(async () => {
    if (!entry || !pair || isFinalizing.current) return;
    const context = createConfidentialContext(currencyId, createConfidentialClient);
    try {
      let pending: PendingUnshield | undefined = entry.pending;
      if (!pending) {
        const receipt = await getReceipt(getSepoliaRpcUrl(), entry.requestTxHash);
        if (!receipt) {
          setView({ status: "awaiting-request" });
          return;
        }
        pending = {
          ...confidentialApi.parseUnwrapRequested(
            context,
            currencyId,
            toReceipt(receipt),
            pair.wrapper,
          ),
          amount: entry.amount,
        };
        setSessionUnshield(tokenAccountId, { ...entry, pending });
      }
      const next = await confidentialApi.resumeUnshield(
        context,
        currencyId,
        pending,
        UNSHIELD_REQUIRED_CONFIRMATIONS,
      );
      if (next.status === "finalized") {
        clearSessionUnshield(tokenAccountId);
        onFinalized();
      } else if (next.status === "invalid") {
        setView({ status: "failed", error: "unknown" });
      } else if (next.status === "blocked") {
        setView({ status: "failed", error: getConfidentialErrorKind(next.error) });
      } else {
        setView(next);
      }
    } catch (error) {
      setView({ status: "failed", error: getConfidentialErrorKind(error) });
    }
  }, [createConfidentialClient, currencyId, entry, onFinalized, pair, tokenAccountId]);

  useEffect(() => {
    if (!entry) return;
    void poll();
    const timer = setInterval(() => void poll(), UNSHIELD_POLL_MS);
    return () => clearInterval(timer);
  }, [entry, poll]);

  const finalize = useCallback(async () => {
    const pending = entry?.pending;
    if (!pending || isFinalizing.current) return;
    isFinalizing.current = true;
    setView({ status: "finalizing" });
    try {
      const context = createConfidentialContext(currencyId, createConfidentialClient);
      const prepared = await confidentialApi.prepareFinalizeUnshield(context, currencyId, pending);
      const executor = createDeviceTransactionExecutor({ currencyId, context, signTransaction });
      const hash = await executor.signAndBroadcast({ transaction: prepared.transaction });
      await executor.waitForConfirmation(hash);
      clearSessionUnshield(tokenAccountId);
      onFinalized();
    } catch (error) {
      setView({ status: "failed", error: getConfidentialErrorKind(error) });
    } finally {
      isFinalizing.current = false;
    }
  }, [createConfidentialClient, currencyId, entry, onFinalized, signTransaction, tokenAccountId]);

  if (!entry) return null;
  return {
    ...view,
    amount: entry.amount,
    onFinalize: finalize,
    onDismiss: () => clearSessionUnshield(tokenAccountId),
  };
}

export type PendingUnshieldViewModel = NonNullable<ReturnType<typeof usePendingUnshield>>;
