import { ERC20_TRANSFER_EVENT_TOPIC } from "../../constants";
import type { HederaThirdwebTransaction } from "../../types";

export const getMockedThirdwebTransaction = (
  overrides?: Partial<HederaThirdwebTransaction>,
): HederaThirdwebTransaction => {
  return {
    address: "0x0000000000000000000000000000000000000002",
    blockHash: "0x0000000000000000000000000000000000000002",
    blockNumber: 1,
    blockTimestamp: 1234123,
    chainId: "295",
    data: "0x0000000000000000000000000000000000000002",
    decoded: {
      name: "test",
      params: {
        from: "0x0000000000000000000000000000000000000001",
        to: "0x0000000000000000000000000000000000000002",
        value: "10000",
      },
      signature: "abc",
    },
    logIndex: 1,
    topics: [
      ERC20_TRANSFER_EVENT_TOPIC,
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
    ],
    transactionHash: "0x0000000000000000000000000000000000000003",
    transactionIndex: 2,
    ...overrides,
  };
};
