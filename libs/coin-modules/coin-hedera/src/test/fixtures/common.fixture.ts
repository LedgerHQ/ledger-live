import BigNumber from "bignumber.js";
import type network from "@ledgerhq/live-network";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getMockedThirdwebTransaction } from "./thirdweb.fixture";
import type { ERC20OperationFields, OperationERC20 } from "../../types";

export const getMockResponse = (data: unknown): Awaited<ReturnType<typeof network>> => ({
  data,
  status: 200,
});

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
  hasFailed: false,
  ...overrides,
});
