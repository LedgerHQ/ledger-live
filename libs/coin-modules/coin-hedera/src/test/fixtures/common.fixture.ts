import type network from "@ledgerhq/live-network";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import type { ERC20OperationFields, EnrichedERC20Transfer, OperationERC20 } from "../../types";
import { getMockedMirrorTransaction } from "./mirror.fixture";
import { getMockedThirdwebTransaction } from "./thirdweb.fixture";

export const getMockResponse = (data: unknown): Awaited<ReturnType<typeof network>> => ({
  data,
  status: 200,
});

// TODO: remove once migration to new API is complete
export const getMockERC20Operation = ({
  hash,
  from,
  to,
  token,
}: {
  hash: string;
  from: string;
  to: string;
  token: TokenCurrency;
}): OperationERC20 => ({
  thirdwebTransaction: getMockedThirdwebTransaction({
    transactionHash: hash,
    blockHash: "0xBLOCK",
    decoded: {
      name: "Transfer",
      signature: "Transfer(address,address,uint256)",
      params: {
        from,
        to,
        value: "1000000",
      },
    },
  }),
  mirrorTransaction: {
    transaction_hash: hash,
    consensus_timestamp: "1234567890.000000000",
    transaction_id: "0.0.123@1234567890.000",
    charged_tx_fee: 100000,
    memo_base64: "",
  } as any,
  contractCallResult: {
    timestamp: "1234567890.000000000",
    contract_id: "0.0.TOKEN",
    gas_consumed: 50000,
    gas_limit: 100000,
    gas_used: 50000,
  } as any,
  token,
});

// TODO: remove once migration to new API is complete
export const getMockERC20Fields = (
  overrides?: Partial<ERC20OperationFields>,
): ERC20OperationFields => ({
  date: new Date("2024-01-15T10:00:00Z"),
  type: "OUT",
  fee: new BigNumber(100000),
  value: new BigNumber(1000000),
  senders: ["0.0.SENDER"],
  recipients: ["0.0.RECIPIENT"],
  blockHeight: 12345,
  blockHash: "0xBLOCK",
  extra: {
    consensusTimestamp: "1234567890.000000000",
    transactionId: "0.0.123@1234567890.000",
    gasConsumed: 50000,
    gasLimit: 100000,
    gasUsed: 50000,
  },
  standard: "erc20",
  contract: "0xca367694cdac8f152e33683bb36cc9d6a73f1ef2",
  hasFailed: false,
  ...overrides,
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
