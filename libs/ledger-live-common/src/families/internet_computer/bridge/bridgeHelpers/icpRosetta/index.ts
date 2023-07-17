import Transport from "@ledgerhq/hw-transport";
import { Account } from "@ledgerhq/types-live";
import { Transaction } from "../../../types";
import ICP from "@zondax/ledger-icp";
import { constructionInvoke, getICPRosettaNetworkIdentifier } from "../api";
import {
  ICPRosettaConstructionCombineRequest,
  ICPRosettaConstructionCombineResponse,
  ICPRosettaConstructionHashRequest,
  ICPRosettaConstructionHashResponse,
  ICPRosettaConstructionPayloadsRequest,
  ICPRosettaConstructionPayloadsResponse,
  ICPRosettaConstructionSubmitRequest,
  ICPRosettaConstructionSubmitResponse,
} from "./types";
import { ingressExpiry, generateOperations, generateSignaturesPayload } from "./utils";
import { Cbor } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { isError } from "../../../utils";
import BigNumber from "bignumber.js";

export const getUnsignedTransaction = async (
  transaction: Transaction,
  account: Account,
): Promise<{
  unsignedTxn: string;
  payloads: ICPRosettaConstructionPayloadsResponse["payloads"];
}> => {
  const ops = generateOperations(transaction, account);
  const pubkeys = [
    {
      hex_bytes: account.xpub ?? "",
      curve_type: "secp256k1",
    },
  ];

  const reqOpts: ICPRosettaConstructionPayloadsRequest = {
    ...getICPRosettaNetworkIdentifier(),
    operations: ops,
    public_keys: pubkeys,
    metadata: {
      memo: parseInt(transaction.memo ?? "0"),
    },
  };
  const { payloads, unsigned_transaction } = await constructionInvoke<
    ICPRosettaConstructionPayloadsRequest,
    ICPRosettaConstructionPayloadsResponse
  >(reqOpts, "payloads");

  return { unsignedTxn: unsigned_transaction, payloads };
};

export const signICPTransaction = async ({
  unsignedTxn,
  transport,
  path,
  payloads,
  pubkey,
}: {
  unsignedTxn: string;
  transport: Transport;
  path: string;
  payloads: ICPRosettaConstructionPayloadsResponse["payloads"];
  pubkey: string;
}): Promise<{
  signatures: { txnSig: string; readSig: string };
  signedTxn: string;
}> => {
  const icp = new ICP(transport);
  const decodedTxn: any = Cbor.decode(Buffer.from(unsignedTxn, "hex"));
  const txnReqFromCbor = decodedTxn.updates[0][1];
  const expiry = new ingressExpiry(BigNumber(decodedTxn.ingress_expiries[0].toString()));

  const submitReq = {
    request_type: "call",
    canister_id: Principal.fromUint8Array(txnReqFromCbor.canister_id),
    method_name: txnReqFromCbor.method_name,
    arg: txnReqFromCbor.arg,
    sender: Principal.fromUint8Array(txnReqFromCbor.sender),
    ingress_expiry: expiry,
  };

  const txnBlobToSign = Cbor.encode({
    content: submitReq,
  });

  const signedTxnRes = await icp.sign(path, Buffer.from(txnBlobToSign), 0);
  isError(signedTxnRes);

  const result = {
    signatures: {
      readSig: "",
      txnSig: Buffer.from(signedTxnRes.signatureRS ?? "").toString("hex"),
    },
  };

  const signaturesPayload = generateSignaturesPayload(result.signatures, payloads, pubkey);

  const { signed_transaction: signedTxn } = await constructionInvoke<
    ICPRosettaConstructionCombineRequest,
    ICPRosettaConstructionCombineResponse
  >(
    {
      ...getICPRosettaNetworkIdentifier(),
      signatures: signaturesPayload,
      unsigned_transaction: unsignedTxn,
    },
    "combine",
  );

  return { ...result, signedTxn };
};

export const getTxnMetadata = async (signedTxn: string): Promise<{ hash: string }> => {
  const {
    transaction_identifier: { hash },
  } = await constructionInvoke<
    ICPRosettaConstructionHashRequest,
    ICPRosettaConstructionHashResponse
  >({ ...getICPRosettaNetworkIdentifier(), signed_transaction: signedTxn }, "hash");

  return { hash };
};

export const getTxnExpirationDate = (_unsignedTxn: string): Date => {
  return new Date();
};

export const broadcastTxn = async (signedTxn: string) => {
  await constructionInvoke<
    ICPRosettaConstructionSubmitRequest,
    ICPRosettaConstructionSubmitResponse
  >({ ...getICPRosettaNetworkIdentifier(), signed_transaction: signedTxn }, "submit");
};
