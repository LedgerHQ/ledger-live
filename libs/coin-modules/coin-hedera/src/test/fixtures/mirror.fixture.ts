import type {
  HederaMirrorAccount,
  HederaMirrorCoinTransfer,
  HederaMirrorToken,
  HederaMirrorTokenTransfer,
  HederaMirrorTransaction,
} from "../../types";

export const getMockedMirrorTransaction = (
  overrides: Partial<HederaMirrorTransaction> = {},
): HederaMirrorTransaction => ({
  consensus_timestamp: "1625097600.000000000",
  transaction_hash: "hash1",
  transaction_id: "0.0.12345-1625097600-000000000",
  charged_tx_fee: 500000,
  result: "SUCCESS",
  token_transfers: [],
  staking_reward_transfers: [],
  transfers: [],
  name: "CRYPTOTRANSFER",
  memo_base64: "",
  entity_id: "",
  ...overrides,
});

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
    evm_address: "0x12345",
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
