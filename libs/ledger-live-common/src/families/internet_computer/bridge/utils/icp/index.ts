import { mapTransferProtoError } from "@dfinity/nns";
import {
  CallRequest,
  Cbor,
  requestIdOf,
  SubmitRequestType,
  SubmitResponse,
} from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

import { Memo, Payment, SendRequest } from "@dfinity/nns/dist/proto/ledger_pb";
import { TransferRequest } from "@dfinity/nns/dist/types/types/ledger_converters";
import { Expiry, subAccountNumbersToSubaccount, toICPTs } from "./utils";
import {
  DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS,
  ICP_FEES,
  ICP_HOST,
  ICP_LEDGER_CANISTER_TRANSFER_METHOD,
  MAINNET_LEDGER_CANISTER_ID,
} from "../../../consts";
import { AxiosRequestConfig } from "axios";
import network from "../../../../../network";
import { BroadcastResult } from "../types";

export const createTxnRequest = ({
  to,
  amount,
  memo,
  fee,
  fromSubAccount,
}: TransferRequest): SendRequest => {
  const request = new SendRequest();
  request.setTo(to.toProto());

  const payment = new Payment();
  payment.setReceiverGets(toICPTs(amount));
  request.setPayment(payment);

  request.setMaxFee(toICPTs(fee ?? BigInt(ICP_FEES)));

  // Always explicitly set the memo for compatibility with ledger wallet - hardware wallet
  const requestMemo: Memo = new Memo();
  requestMemo.setMemo((memo ?? BigInt(0)).toString());
  request.setMemo(requestMemo);

  if (fromSubAccount !== undefined) {
    request.setFromSubaccount(subAccountNumbersToSubaccount(fromSubAccount));
  }

  return request;
};

export const createTxnOptions = (
  requestSerialized: Uint8Array
): {
  methodName: string;
  arg: Uint8Array;
  effectiveCanisterId: string;
} => {
  return {
    methodName: ICP_LEDGER_CANISTER_TRANSFER_METHOD,
    arg: requestSerialized,
    effectiveCanisterId: MAINNET_LEDGER_CANISTER_ID,
  };
};

export function generateBlobToSign(
  options: {
    methodName: string;
    arg: ArrayBuffer;
    effectiveCanisterId?: Principal | string;
  },
  principalText: string,
  date: Date
): { toSign: ArrayBuffer } {
  const submit: CallRequest = createSubmitRequest(options, principalText, date);

  const toSign = Cbor.encode({ content: submit });
  return { toSign };
}

export const createSubmitRequest = (
  options: {
    methodName: string;
    arg: ArrayBuffer;
    effectiveCanisterId?: Principal | string;
  },
  principalText: string,
  date: Date
): CallRequest => {
  const canister = Principal.from(MAINNET_LEDGER_CANISTER_ID);
  const sender: Principal = Principal.fromText(principalText);
  const ingress_expiry = new Expiry(
    DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS,
    date
  );

  return {
    request_type: SubmitRequestType.Call,
    canister_id: canister,
    method_name: options.methodName,
    arg: options.arg,
    sender,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ingress_expiry,
  };
};

export const createTransformRequest = (submit: CallRequest) => {
  return {
    request: {
      method: "POST",
      headers: {
        "Content-Type": "application/cbor",
      },
    },
    endpoint: "call",
    body: submit,
  };
};

export const submitFinalRequest = async (
  submit: CallRequest,
  transformedRequest: any
): Promise<SubmitResponse> => {
  const body = Cbor.encode(transformedRequest.body);

  // Run both in parallel. The fetch is quite expensive, so we have plenty of time to
  // calculate the requestId locally.

  const ecid = Principal.from(MAINNET_LEDGER_CANISTER_ID);

  const requestOptions: AxiosRequestConfig = {
    url: "" + new URL(`/api/v2/canister/${ecid.toText()}/call`, ICP_HOST),
    ...transformedRequest.request,
    data: Buffer.from(body),
  };

  const request = network(requestOptions);

  const [response, requestId] = await Promise.all([
    request,
    requestIdOf(submit),
  ]);

  return {
    requestId,
    response: {
      ok: response.statusText === "Accepted",
      status: response.status,
      statusText: response.statusText,
    },
  };
};

export const broadcastTxn = async (
  submit: CallRequest,
  transformedRequest: any
): Promise<BroadcastResult> => {
  try {
    const canisterId = MAINNET_LEDGER_CANISTER_ID;
    const methodName = ICP_LEDGER_CANISTER_TRANSFER_METHOD;

    const submitResponse = await submitFinalRequest(submit, transformedRequest);

    if (!submitResponse.response.ok) {
      throw new Error(
        [
          "Call failed:",
          `  Method: ${methodName}`,
          `  Canister ID: ${canisterId}`,
          `  Request ID: ${submitResponse.requestId}`,
          `  HTTP status code: ${submitResponse.response.status}`,
          `  HTTP status text: ${submitResponse.response.statusText}`,
        ].join("\n")
      );
    }

    return {
      ...submitResponse,
      // txnHash: txns.transactions[0].transaction.transaction_identifier.hash,
      // blockHeight,
    };
  } catch (err) {
    if (err instanceof Error) {
      throw mapTransferProtoError(err);
    }

    throw err;
  }
};
