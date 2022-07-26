import { ProtocolParams } from "../types";

type APIToken = { assetName: string; policyId: string; value: string };

type APIMetadata = { label: string; value: string };

export type APITransaction = {
  fees: string;
  hash: string;
  timestamp: string;
  blockHeight: number;
  inputs: Array<{
    txId: string;
    index: number;
    address: string;
    value: string;
    paymentKey: string;
    tokens: Array<APIToken>;
  }>;
  outputs: Array<{
    address: string;
    value: string;
    paymentKey: string;
    tokens: Array<APIToken>;
  }>;
  metadata?: {
    data: Array<APIMetadata>;
  };
};

export type APINetworkInfo = {
  protocolParams: ProtocolParams;
};
