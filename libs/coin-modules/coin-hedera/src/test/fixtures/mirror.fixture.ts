import type {
  HederaMirrorAccount,
  HederaMirrorCoinTransfer,
  HederaMirrorToken,
  HederaMirrorTokenTransfer,
  HederaMirrorTransaction,
  HederaMirrorContractCallResult,
} from "../../types";

export const getMockedMirrorToken = (overrides?: Partial<HederaMirrorToken>): HederaMirrorToken => {
  return {
    token_id: "",
    created_timestamp: "123",
    automatic_association: false,
    balance: 0,
    decimals: 0,
    freeze_status: "NOT_APPLICABLE",
    kyc_status: "NOT_APPLICABLE",
    ...overrides,
  };
};

export const getMockedMirrorAccount = (
  overrides?: Partial<HederaMirrorAccount>,
): HederaMirrorAccount => {
  return {
    account: "0.0.12345",
    evm_address: "0x0000000000000000000000000000000000012345",
    created_timestamp: "1760932745.835883000",
    balance: {
      balance: 1000,
      timestamp: "1764932745.835883000",
      tokens: [],
    },
    max_automatic_token_associations: -1,
    pending_reward: 0,
    staked_node_id: null,
    ...overrides,
  };
};

export const createMirrorCoinTransfer = (
  account: string,
  amount: number,
): HederaMirrorCoinTransfer => ({
  account,
  amount,
});

export const createMirrorTokenTransfer = (
  account: string,
  amount: number,
  tokenId: string,
): HederaMirrorTokenTransfer => ({
  token_id: tokenId,
  account,
  amount,
});

export const getMockedMirrorTransaction = (
  overrides?: Partial<HederaMirrorTransaction>,
): HederaMirrorTransaction => {
  const timestamp = overrides?.consensus_timestamp ?? "1764932745.835883000";

  return {
    entity_id: "0.0.1234",
    transaction_id: `0.0.1234-${timestamp}`,
    transaction_hash: `hash_${timestamp}`,
    consensus_timestamp: timestamp,
    charged_tx_fee: 100000,
    result: "SUCCESS",
    name: "CRYPTOTRANSFER",
    staking_reward_transfers: [],
    transfers: [],
    token_transfers: [],
    memo_base64: "",
    ...overrides,
  };
};

export const getMockedMirrorContractCallResult = (
  overrides?: Partial<HederaMirrorContractCallResult>,
): HederaMirrorContractCallResult => ({
  contract_id: "0.0.12345",
  timestamp: "1764932745.835883000",
  block_hash: "0xblockhash",
  block_gas_used: 100000,
  gas_consumed: 50000,
  gas_limit: 100000,
  gas_used: 50000,
  ...overrides,
});
