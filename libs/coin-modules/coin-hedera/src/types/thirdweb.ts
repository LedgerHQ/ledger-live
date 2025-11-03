export interface HederaThirdwebDecodedTransferParams {
  from: string;
  to: string;
  value: string;
}

export interface HederaThirdwebTransaction {
  address: string;
  blockHash: string;
  blockNumber: number;
  blockTimestamp: number;
  chainId: string;
  data: string;
  decoded: {
    name: string;
    params: Record<string, unknown>;
    signature: string;
  };
  logIndex: number;
  topics: string[];
  transactionHash: string;
  transactionIndex: number;
}

export interface HederaThirdwebPagination {
  limit: number;
  page: number;
  totalCount: number;
}

export interface HederaThirdwebContractEventsResponse {
  result: {
    events: HederaThirdwebTransaction[];
    pagination: HederaThirdwebPagination;
  };
}
