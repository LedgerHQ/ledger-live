import type network from "@ledgerhq/live-network";
import type { EnrichedERC20Transfer } from "../../types";
import { getMockedMirrorTransaction } from "./mirror.fixture";

export const getMockResponse = (data: unknown): Awaited<ReturnType<typeof network>> => ({
  data,
  status: 200,
});

export const getMockedEnrichedERC20Transfer = (
  overrides?: Partial<EnrichedERC20Transfer>,
): EnrichedERC20Transfer => {
  const consensusTimestamp =
    overrides?.mirrorTransaction?.consensus_timestamp ?? "1625097600.000000000";

  return {
    transfer: {
      token_id: 12345,
      token_evm_address: "0x1234",
      sender_account_id: 1234,
      receiver_account_id: 5678,
      sender_evm_address: "0x1234",
      receiver_evm_address: "0x5678",
      payer_account_id: 1234,
      amount: 1000,
      transaction_hash: `hash_erc20_${consensusTimestamp}`,
      consensus_timestamp: Number(consensusTimestamp) * 10 ** 9,
      transfer_type: "transfer",
    },
    contractCallResult: {
      block_hash: "0xblock",
      contract_id: "0.0.12345",
      block_gas_used: 100000,
      gas_consumed: 50000,
      gas_limit: 100000,
      gas_used: 50000,
      timestamp: consensusTimestamp,
    },
    mirrorTransaction: getMockedMirrorTransaction({
      consensus_timestamp: consensusTimestamp,
      name: "CONTRACTCALL",
    }),
    ...overrides,
  };
};
