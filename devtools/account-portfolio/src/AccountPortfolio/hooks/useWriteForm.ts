import { useState } from "react";
import { isJsonObject } from "../../utils/json";

/**
 * A starting point for an EVM intent. The service accepts the types `send-legacy`, `send-eip1559`,
 * `staking-legacy` and `staking-eip1559` there; other networks have their own.
 */
export const INTENT_TEMPLATE = JSON.stringify(
  {
    type: "send-eip1559",
    sender: "<sender address>",
    recipient: "<recipient address>",
    amount: "1000",
    asset: "native",
    feesStrategy: "medium",
  },
  null,
  2,
);

/** What the Write tab holds: the transaction being built, signed and sent. */
export interface WriteFormViewModel {
  readonly intentJson: string;
  readonly setIntentJson: (value: string) => void;
  readonly intentValid: boolean;
  readonly customFees: string;
  readonly setCustomFees: (value: string) => void;
  readonly rawTransaction: string;
  readonly setRawTransaction: (value: string) => void;
  readonly signature: string;
  readonly setSignature: (value: string) => void;
  readonly pubkey: string;
  readonly setPubkey: (value: string) => void;
  readonly signedTransaction: string;
  readonly setSignedTransaction: (value: string) => void;
  /** Broadcasting sends a real transaction, so it waits for this to be switched on. */
  readonly confirmBroadcast: boolean;
  readonly setConfirmBroadcast: (value: boolean) => void;
  readonly canEstimate: boolean;
  readonly canEncode: boolean;
  readonly canCombine: boolean;
  readonly canBroadcast: boolean;
  /** The request fields of the Write calls. */
  readonly writeFields: {
    readonly intentJson: string;
    readonly customFees: string;
    readonly rawTransaction: string;
    readonly signature: string;
    readonly pubkey: string;
    readonly signedTransaction: string;
  };
}

/** `network` is the one named in the Networks tab: every Write call needs a chain. */
export function useWriteForm(network: string): WriteFormViewModel {
  const [intentJson, setIntentJson] = useState(INTENT_TEMPLATE);
  const [customFees, setCustomFees] = useState("");
  const [rawTransaction, setRawTransaction] = useState("");
  const [signature, setSignature] = useState("");
  const [pubkey, setPubkey] = useState("");
  const [signedTransaction, setSignedTransaction] = useState("");
  const [confirmBroadcast, setConfirmBroadcast] = useState(false);

  const named = network.trim() !== "";
  const intentValid = isJsonObject(intentJson);
  return {
    intentJson,
    setIntentJson,
    intentValid,
    customFees,
    setCustomFees,
    rawTransaction,
    setRawTransaction,
    signature,
    setSignature,
    pubkey,
    setPubkey,
    signedTransaction,
    setSignedTransaction,
    confirmBroadcast,
    setConfirmBroadcast,
    canEstimate: named && intentValid,
    canEncode: named && intentValid,
    canCombine: named && rawTransaction.trim() !== "" && signature.trim() !== "",
    canBroadcast: named && signedTransaction.trim() !== "" && confirmBroadcast,
    writeFields: {
      intentJson,
      customFees: customFees.trim(),
      rawTransaction: rawTransaction.trim(),
      signature: signature.trim(),
      pubkey: pubkey.trim(),
      signedTransaction: signedTransaction.trim(),
    },
  };
}
