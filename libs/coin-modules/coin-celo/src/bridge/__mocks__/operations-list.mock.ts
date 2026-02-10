import { BigNumber } from "bignumber.js";

export const mockCreateApi = jest.fn();

jest.mock("@ledgerhq/coin-evm/api/index", () => {
  return {
    createApi: () => mockCreateApi(),
  };
});

export const erc20Operation = {
  asset: {
    assetOwner: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
    assetReference: "0x471EcE3750Da237f93B8E339c536989b8978a438",
    type: "erc20",
  },
  details: {
    assetAmount: "200000000000000000000",
  },
  id: "js:2:celo:address",
  recipients: ["0x0000000000000000000000000000000000001d00"],
  senders: ["0x5a40FEE4eFebE3c85eDD3C79E15e221B7261a000"],
  tx: {
    block: {
      height: 2000,
      hash: "0xsa",
    },
    date: new Date("2026-01-09"),
    failed: false,
    fees: BigNumber(525072996210000),
    hash: "0xs",
  },
  type: "OUT",
  value: BigNumber(0),
};

export const nativeOperation = {
  asset: {
    type: "native",
  },
  details: {
    sequence: new BigNumber(111),
  },
  id: "js:2:celo:address",
  recipients: ["0x5a40FEE4eFebE3c85eDD3C79E15e221B7261a000"],
  senders: ["0x5a40FEE4eFebE3c85eDD3C79E15e221B7261a000"],
  tx: {
    block: {
      height: 2000,
      hash: "0xsa",
    },
    date: new Date("2026-01-09"),
    failed: false,
    fees: BigNumber(525072996210000),
    hash: "0xs",
  },
  type: "OUT",
  value: BigNumber(0),
};
