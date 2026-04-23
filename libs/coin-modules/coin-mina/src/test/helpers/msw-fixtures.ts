import { MINA_TOKEN_ID } from "../../consts";
import type {
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
  ValidatorInfoFromAPI,
} from "../../network/types";

export function makeNetworkStatusResponse(
  overrides?: Partial<FetchNetworkStatusResponse>,
): FetchNetworkStatusResponse {
  return {
    current_block_identifier: { index: 350000, hash: "block-hash-350000" },
    current_block_timestamp: Date.now(),
    genesis_block_identifier: { index: 1, hash: "genesis-hash" },
    oldest_block_identifier: { index: 1, hash: "oldest-hash" },
    sync_status: { current_index: 350000, stage: "Synced", synced: true },
    peers: [{ peer_id: "peer-1" }],
    ...overrides,
  };
}

export function makeAccountBalanceResponse(overrides?: {
  totalBalance?: number;
  liquidBalance?: number;
  lockedBalance?: number;
  nonce?: string;
}): FetchAccountBalanceResponse {
  const total = overrides?.totalBalance ?? 5_000_000_000;
  const liquid = overrides?.liquidBalance ?? total;
  const locked = overrides?.lockedBalance ?? 0;
  return {
    block_identifier: { index: 350000, hash: "block-hash-350000" },
    balances: [
      {
        value: String(total),
        currency: { symbol: "MINA", decimals: 9 },
        metadata: {
          locked_balance: locked,
          liquid_balance: liquid,
          total_balance: total,
        },
      },
    ],
    metadata: {
      created_via_historical_lookup: false,
      nonce: overrides?.nonce ?? "42",
    },
  };
}

export function makeRosettaTransaction(overrides?: {
  hash?: string;
  blockIndex?: number;
  blockHash?: string;
  timestamp?: number;
  fromAddress?: string;
  toAddress?: string;
  feeValue?: string;
  paymentValue?: string;
  status?: "Success" | "Failed";
  memo?: string;
  nonce?: number;
}): RosettaTransaction {
  const from = overrides?.fromAddress ?? "B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD";
  const to = overrides?.toAddress ?? "B62qkWcHhoisWDCR7v3gvWzX6wXEVuGYLHXq3mSym4GEzfYXmSDv314";
  const status = overrides?.status ?? "Success";
  const fee = overrides?.feeValue ?? "-10000000";
  const value = overrides?.paymentValue ?? "100000000";
  const tokenId = MINA_TOKEN_ID;

  return {
    block_identifier: {
      index: overrides?.blockIndex ?? 100,
      hash: overrides?.blockHash ?? "block-hash-100",
    },
    transaction: {
      transaction_identifier: { hash: overrides?.hash ?? "txn-hash-001" },
      operations: [
        {
          operation_identifier: { index: 0 },
          type: "fee_payment",
          status,
          account: { address: from, metadata: { token_id: tokenId } },
          amount: { value: fee, currency: { symbol: "MINA", decimals: 9 } },
        },
        {
          operation_identifier: { index: 1 },
          type: "payment_source_dec",
          status,
          account: { address: from, metadata: { token_id: tokenId } },
          amount: { value: `-${value}`, currency: { symbol: "MINA", decimals: 9 } },
        },
        {
          operation_identifier: { index: 2 },
          type: "payment_receiver_inc",
          status,
          account: { address: to, metadata: { token_id: tokenId } },
          amount: { value, currency: { symbol: "MINA", decimals: 9 } },
          related_operations: [{ index: 1 }],
        },
      ],
      ...(overrides?.memo === undefined && overrides?.nonce === undefined
        ? {}
        : {
            metadata: {
              ...(overrides?.memo === undefined ? {} : { memo: overrides.memo }),
              ...(overrides?.nonce === undefined ? {} : { nonce: overrides.nonce }),
            },
          }),
    },
    timestamp: overrides?.timestamp ?? 1700000000000,
  };
}

export function makeTransactionsResponse(
  txns: RosettaTransaction[],
  nextOffset?: number,
): FetchAccountTransactionsResponse {
  return {
    transactions: txns,
    total_count: txns.length,
    ...(nextOffset === undefined ? {} : { next_offset: nextOffset }),
  };
}

export function makeBlockInfoResponse(
  blockHeight: number,
  overrides?: { hash?: string; parentHash?: string; timestamp?: number },
): RosettaBlockInfoResponse {
  return {
    block: {
      block_identifier: {
        index: blockHeight,
        hash: overrides?.hash ?? `block-hash-${blockHeight}`,
      },
      parent_block_identifier: {
        index: blockHeight - 1,
        hash: overrides?.parentHash ?? `block-hash-${blockHeight - 1}`,
      },
      timestamp: overrides?.timestamp ?? 1700000000000,
    },
  };
}

export function makePreprocessResponse(
  sender: string,
  receiver: string,
): RosettaPreprocessResponse {
  return {
    options: {
      sender,
      token_id: MINA_TOKEN_ID,
      receiver,
    },
  };
}

export function makeMetadataResponse(overrides?: {
  nonce?: string;
  feeValue?: string;
  minimumFee?: string;
  sender?: string;
  receiver?: string;
  accountCreationFee?: string;
}): RosettaMetadataResponse {
  return {
    metadata: {
      sender: overrides?.sender ?? "B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD",
      nonce: overrides?.nonce ?? "42",
      token_id: MINA_TOKEN_ID,
      receiver: overrides?.receiver ?? "B62qkWcHhoisWDCR7v3gvWzX6wXEVuGYLHXq3mSym4GEzfYXmSDv314",
      ...(overrides?.accountCreationFee === undefined
        ? {}
        : { account_creation_fee: overrides.accountCreationFee }),
    },
    suggested_fee: [
      {
        value: overrides?.feeValue ?? "10000000",
        currency: { symbol: "MINA", decimals: 9 },
        metadata: {
          minimum_fee: {
            value: overrides?.minimumFee ?? "1000000",
            currency: { symbol: "MINA", decimals: 9 },
          },
        },
      },
    ],
  };
}

export function makeSubmitResponse(hash: string): RosettaSubmitResponse {
  return { transaction_identifier: { hash } };
}

export function makeEpochInfoResponse(overrides?: {
  epoch?: string;
  slot?: string;
  globalSlot?: string;
}): FetchEpochInfoResponse {
  return {
    data: {
      daemonStatus: {
        consensusTimeNow: {
          epoch: overrides?.epoch ?? "42",
          slot: overrides?.slot ?? "100",
          globalSlot: overrides?.globalSlot ?? "30000",
          startTime: "1700000000000",
          endTime: "1700100000000",
        },
      },
    },
  };
}

export function makeDelegateAccountResponse(
  publicKey: string | null,
): FetchDelegateAccountResponse {
  return {
    data: {
      account: publicKey ? { delegateAccount: { publicKey } } : null,
    },
  };
}

export function makeValidatorFromAPI(
  overrides?: Partial<ValidatorInfoFromAPI>,
): ValidatorInfoFromAPI {
  return {
    validatorAddress: "B62qvalidator1",
    validatorName: "Test Validator",
    validatorFee: 5,
    delegatorsCount: 100,
    stake: 1_000_000_000,
    nextEpochStake: 1_000_000_000,
    nextEpochDelegationsCount: 50,
    stakePercent: 1.5,
    networkShare: 2,
    canonicalBlocksCount: 500,
    allBlocksCount: 600,
    isVerified: true,
    isActive: true,
    diffStake: 0,
    diffDelegatorsCount: 0,
    validatorImg: "https://img.example.com/v.png",
    description: "A test validator",
    website: "https://example.com",
    ...overrides,
  };
}

export function makeValidatorsPageResponse(
  validators: ValidatorInfoFromAPI[],
  isLast: boolean,
): GetValidatorsResponse {
  return {
    content: validators,
    pageable: {
      sort: { sorted: true, empty: false, unsorted: false },
      pageNumber: 0,
      pageSize: 50,
      offset: 0,
      paged: true,
      unpaged: false,
    },
    last: isLast,
    totalElements: validators.length,
    totalPages: 1,
    size: 50,
    number: 0,
    sort: { sorted: true, empty: false, unsorted: false },
    first: true,
    numberOfElements: validators.length,
    empty: validators.length === 0,
  };
}
