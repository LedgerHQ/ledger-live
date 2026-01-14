import type {
  HederaMirrorAccount,
  HederaMirrorCoinTransfer,
  HederaMirrorToken,
  HederaMirrorTokenTransfer,
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
