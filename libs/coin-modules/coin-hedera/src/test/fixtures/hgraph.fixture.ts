import { ERC20TokenAccount, ERC20TokenTransfer } from "../../types";

export const getMockedERC20TokenBalance = (
  overrides?: Partial<ERC20TokenAccount>,
): ERC20TokenAccount => {
  return {
    token_id: 12345,
    balance: 1_000_000,
    balance_timestamp: 1764932745835883000,
    created_timestamp: 1760932745835883000,
    ...overrides,
  };
};

export const getMockedERC20TokenTransfer = (
  overrides?: Partial<ERC20TokenTransfer>,
): ERC20TokenTransfer => ({
  token_id: 10000,
  token_evm_address: "0x10000",
  sender_account_id: 1234,
  receiver_account_id: 5678,
  sender_evm_address: "0x1234",
  receiver_evm_address: "0x5678",
  payer_account_id: 1234,
  amount: 1000,
  transaction_hash: "hash123",
  transfer_type: "transfer",
  consensus_timestamp: 1704067200 * 10 ** 9,
  ...overrides,
});
