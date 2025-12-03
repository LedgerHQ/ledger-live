import type {
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
