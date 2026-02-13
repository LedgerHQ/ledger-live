import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import { AxiosError } from "axios";

import { getCoinConfig } from "../config";
import {
  MAINNET_NETWORK_IDENTIFIER,
  MAX_TRANSACTIONS_PER_PAGE,
  MINA_API_RETRY_COUNT,
  MINA_DECIMALS,
  MINA_ROSETTA_TIMEOUT,
  MINA_SYMBOL,
  MINA_TOKEN_ID,
} from "../consts";
import {
  FetchAccountBalanceResponse,
  FetchAccountTransactionsResponse,
  FetchDelegateAccountResponse,
  FetchEpochInfoResponse,
  FetchNetworkStatusResponse,
  GetValidatorsResponse,
  RosettaBlockInfoResponse,
  RosettaMetadataResponse,
  RosettaPreprocessResponse,
  RosettaSubmitResponse,
  RosettaTransaction,
  ValidatorInfo,
  ValidatorInfoFromAPI,
} from "./types";

export type {
  FetchAccountBalanceResponse,
  FetchAccountTransactionsResponse,
  FetchDelegateAccountResponse,
  FetchEpochInfoResponse,
  FetchNetworkStatusResponse,
  GetValidatorsResponse,
  RosettaBlockInfoResponse,
  RosettaMetadataResponse,
  RosettaPreprocessResponse,
  RosettaSubmitResponse,
  RosettaTransaction,
  ValidatorInfo,
  ValidatorInfoFromAPI,
} from "./types";

// ── URL helpers ──

const getRosettaUrl = (route: string): string => {
  const currencyConfig = getCoinConfig();
  return `${currencyConfig.infra.API_MINA_ROSETTA_NODE}${route || ""}`;
};

const getGraphqlUrl = (): string => {
  const currencyConfig = getCoinConfig();
  return `${currencyConfig.infra.API_MINA_GRAPHQL_NODE}`;
};

const getBlockberryUrl = (): string => {
  const currencyConfig = getCoinConfig();
  return `${currencyConfig.infra.API_VALIDATORS_BASE_URL}`;
};

// ── Network request utility ──

export const makeNetworkRequest = async <T>({
  method,
  url,
  data,
  timeout = MINA_ROSETTA_TIMEOUT,
  retryCount = 0,
}: {
  method: "POST" | "GET";
  url: string;
  data: any;
  timeout?: number;
  retryCount?: number;
}): Promise<T> => {
  try {
    const response = await network<T>({ method, url, timeout, data });
    if (response.status === 504 && retryCount < MINA_API_RETRY_COUNT) {
      log("debug", "[MINA] (makeNetworkRequest) Request timed out, retrying...");
      return await makeNetworkRequest<T>({
        method,
        url,
        data,
        timeout,
        retryCount: retryCount + 1,
      });
    } else if (response.status !== 200) {
      const errorData =
        typeof response.data === "object" ? JSON.stringify(response.data) : response.data;
      log("error", `[MINA] (makeNetworkRequest) Error: ${errorData}, status: ${response.status}`);
      throw new Error(String(errorData));
    }
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.code === "ECONNABORTED") {
      log("error", "[MINA] (makeNetworkRequest) Error ECONNABORTED: ", error.message);
      if (retryCount < MINA_API_RETRY_COUNT) {
        return await makeNetworkRequest<T>({
          method,
          url,
          data,
          timeout,
          retryCount: retryCount + 1,
        });
      }
      throw error;
    }

    if (error instanceof Error) {
      log("error", "[MINA] (makeNetworkRequest) Error: ", error.message);
      throw error;
    }

    log("error", "[MINA] (makeNetworkRequest) Error unknown: ", error);
    throw error;
  }
};

// ── Rosetta payload helpers ──

type NetworkIdentifier = typeof MAINNET_NETWORK_IDENTIFIER;
export const addNetworkIdentifier = <T extends object>(data: T): T & NetworkIdentifier => {
  return {
    ...MAINNET_NETWORK_IDENTIFIER,
    ...data,
  };
};

interface AccountIdentifier {
  account_identifier: {
    address: string;
    metadata: {
      token_id: string;
    };
  };
}

interface Operation {
  operation_identifier: { index: number };
  type: string;
  account: {
    address: string;
    metadata: {
      token_id: string;
    };
  };
  amount?: {
    value: string;
    currency: {
      symbol: string;
      decimals: number;
    };
  };
  metadata?: {
    delegate_change_target?: string;
  };
  related_operations?: Array<{ index: number }>;
}

interface TransactionPayload {
  operations: Operation[];
}

export const buildAccountIdentifier = (address: string): AccountIdentifier => {
  if (!address) {
    throw new Error("Address is required");
  }

  return {
    account_identifier: {
      address,
      metadata: {
        token_id: MINA_TOKEN_ID,
      },
    },
  };
};

interface MakeOperationOptions {
  idx: number;
  relatedIdxs: number[];
  opType: string;
  addr: string;
  value: number;
  isPositive: boolean;
  isStake?: boolean;
  to?: string;
}

function makeOperation(options: MakeOperationOptions): Operation {
  const { idx, relatedIdxs, opType, addr, value, isPositive, isStake = false, to } = options;
  if (!addr) {
    throw new Error("Address is required");
  }
  if (value < 0) {
    throw new Error("Value cannot be negative");
  }
  if (isStake && !to) {
    throw new Error("Target address is required for delegate change");
  }

  const relatedOps =
    relatedIdxs.length > 0
      ? {
          related_operations: relatedIdxs.map(i => ({ index: i })),
        }
      : {};

  const baseOperation: Operation = {
    operation_identifier: { index: idx },
    ...relatedOps,
    type: opType,
    account: {
      address: addr,
      metadata: {
        token_id: MINA_TOKEN_ID,
      },
    },
  };

  if (!isStake) {
    return {
      ...baseOperation,
      amount: {
        value: `${isPositive ? "" : "-"}${value}`,
        currency: {
          symbol: MINA_SYMBOL,
          decimals: MINA_DECIMALS,
        },
      },
    };
  }

  const metadata: Operation["metadata"] = {};
  if (to) {
    metadata.delegate_change_target = to;
  }

  return {
    ...baseOperation,
    metadata,
  };
}

export function makeDelegateChangePayload(
  from: string,
  to: string,
  feeNano: number,
): TransactionPayload {
  if (!from || !to) {
    throw new Error("Both from and to addresses are required");
  }
  if (feeNano < 0) {
    throw new Error("Fee cannot be negative");
  }

  return {
    operations: [
      makeOperation({
        idx: 0,
        relatedIdxs: [],
        opType: "fee_payment",
        addr: from,
        value: feeNano,
        isPositive: false,
      }),
      makeOperation({
        idx: 1,
        relatedIdxs: [],
        opType: "delegate_change",
        addr: from,
        value: 0,
        isPositive: true,
        isStake: true,
        to,
      }),
    ],
  };
}

export function makeTransferPayload(
  from: string,
  to: string,
  feeNano: number,
  valueNano: number,
): TransactionPayload {
  if (!from || !to) {
    throw new Error("Both from and to addresses are required");
  }
  if (feeNano < 0 || valueNano < 0) {
    throw new Error("Fee and value cannot be negative");
  }

  return {
    operations: [
      makeOperation({
        idx: 0,
        relatedIdxs: [],
        opType: "fee_payment",
        addr: from,
        value: feeNano,
        isPositive: false,
      }),
      makeOperation({
        idx: 1,
        relatedIdxs: [],
        opType: "payment_source_dec",
        addr: from,
        value: valueNano,
        isPositive: false,
      }),
      makeOperation({
        idx: 2,
        relatedIdxs: [1],
        opType: "payment_receiver_inc",
        addr: to,
        value: valueNano,
        isPositive: true,
      }),
    ],
  };
}

// ── Rosetta API functions ──

export const fetchNetworkStatus = async () => {
  return await makeNetworkRequest<FetchNetworkStatusResponse>({
    method: "POST",
    url: getRosettaUrl("/network/status"),
    data: addNetworkIdentifier({}),
  });
};

export const fetchAccountBalance = async (address: string) => {
  return await makeNetworkRequest<FetchAccountBalanceResponse>({
    method: "POST",
    url: getRosettaUrl("/account/balance"),
    data: addNetworkIdentifier(buildAccountIdentifier(address)),
  });
};

export const fetchAccountTransactions = async (
  address: string,
  offset: number = 0,
): Promise<RosettaTransaction[]> => {
  const transactions: RosettaTransaction[] = [];
  let currentOffset: number | undefined = offset;
  while (currentOffset !== undefined) {
    const response: FetchAccountTransactionsResponse =
      await makeNetworkRequest<FetchAccountTransactionsResponse>({
        method: "POST",
        url: getRosettaUrl("/search/transactions"),
        data: {
          ...addNetworkIdentifier(buildAccountIdentifier(address)),
          offset: currentOffset,
          limit: MAX_TRANSACTIONS_PER_PAGE,
          include_timestamp: true,
        },
      });
    transactions.push(...response.transactions);

    currentOffset = response.next_offset;
  }

  return transactions;
};

export const rosettaGetBlockInfo = async (blockHeight: number) => {
  return await makeNetworkRequest<RosettaBlockInfoResponse>({
    method: "POST",
    url: getRosettaUrl("/block"),
    data: addNetworkIdentifier({ block_identifier: { index: blockHeight } }),
  });
};

const rosettaPreprocess = async (from: string, to: string, feeNano: number, valueNano: number) => {
  const payload = makeTransferPayload(from, to, feeNano, valueNano);
  return await makeNetworkRequest<RosettaPreprocessResponse>({
    method: "POST",
    url: getRosettaUrl("/construction/preprocess"),
    data: addNetworkIdentifier(payload),
  });
};

export const fetchTransactionMetadata = async (
  srcAddress: string,
  destAddress: string,
  feeNano: number,
  valueNano: number,
) => {
  const options = await rosettaPreprocess(srcAddress, destAddress, feeNano, valueNano);
  const payload = makeTransferPayload(srcAddress, destAddress, feeNano, valueNano);
  return await makeNetworkRequest<RosettaMetadataResponse>({
    method: "POST",
    url: getRosettaUrl("/construction/metadata"),
    data: addNetworkIdentifier({ ...payload, ...options }),
  });
};

export const rosettaSubmitTransaction = async (blob: string) => {
  return await makeNetworkRequest<RosettaSubmitResponse>({
    method: "POST",
    url: getRosettaUrl("/construction/submit"),
    data: addNetworkIdentifier({ signed_transaction: blob }),
  });
};

// ── GraphQL API functions ──

export const getEpochInfo = async (): Promise<FetchEpochInfoResponse> => {
  return await makeNetworkRequest<FetchEpochInfoResponse>({
    method: "POST",
    url: getGraphqlUrl(),
    data: {
      query: `
        query {
            daemonStatus {
              consensusTimeNow {
                epoch
                slot
                globalSlot
                startTime
                endTime
              }
            }
          }
      `,
    },
  });
};

export const getDelegateAccount = async (
  address: string,
): Promise<FetchDelegateAccountResponse> => {
  return await makeNetworkRequest<FetchDelegateAccountResponse>({
    method: "POST",
    url: getGraphqlUrl(),
    data: {
      query: `
        query {
          account(publicKey: "${address}"){
            delegateAccount{
              publicKey
            }
          }
        }
      `,
    },
  });
};

// ── Validator API functions ──

export const fetchValidators = async (): Promise<ValidatorInfo[]> => {
  const validators: ValidatorInfoFromAPI[] = [];

  let currentPage = 0;
  let hasMore = true;

  while (hasMore) {
    const baseUrl = `${getBlockberryUrl()}`;
    const { data } = await network<GetValidatorsResponse>({
      method: "GET",
      url: `${baseUrl}?page=${currentPage}&size=50&orderBy=DESC&sortBy=DELEGATORS&type=ACTIVE&isVerifiedOnly=true`,
    });

    validators.push(...data.content);
    hasMore = !data.last;
    currentPage++;
  }

  return validators.map(validator => ({
    address: validator.validatorAddress,
    name: validator.validatorName,
    fee: validator.validatorFee,
    delegatorsCount: validator.delegatorsCount,
    validatorLogo: validator.validatorImg,
    identityName: validator.validatorName,
    description: validator.description,
    website: validator.website,
    stake: validator.stake,
    delegations: validator.nextEpochDelegationsCount,
    blocksCreated: validator.canonicalBlocksCount,
  }));
};
