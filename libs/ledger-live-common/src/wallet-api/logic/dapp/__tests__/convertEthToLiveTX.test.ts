import BigNumber from "bignumber.js";
import type { WalletAPITransaction } from "../../../types";
import { convertEthToLiveTX } from "../convertEthToLiveTX";

jest.mock("@ledgerhq/coin-evm/utils", () => ({
  safeEncodeEIP55: (addr: string) => `checksummed:${addr}`,
}));

type EthWalletAPITransaction = Extract<WalletAPITransaction, { family: "ethereum" }>;

describe("convertEthToLiveTX", () => {
  it("maps a fully populated eth transaction into a WalletAPITransaction", () => {
    const tx = convertEthToLiveTX({
      to: "0xrecipient",
      value: "0x64", // 100
      gasPrice: "0x10", // 16
      gas: "0x5208", // 21000
      data: "0xabcd",
    }) as EthWalletAPITransaction;

    expect(tx.family).toBe("ethereum");
    expect(tx.recipient).toBe("checksummed:0xrecipient");
    expect(tx.amount).toEqual(new BigNumber(100));
    expect(tx.gasPrice).toEqual(new BigNumber(16));
    expect(tx.gasLimit).toEqual(new BigNumber(21000));
    expect(tx.data).toEqual(Buffer.from("abcd", "hex"));
  });

  it("defaults amount to 0 and leaves optional fields undefined when omitted", () => {
    const tx = convertEthToLiveTX({ to: "0xrecipient" }) as EthWalletAPITransaction;

    expect(tx.amount).toEqual(new BigNumber(0));
    expect(tx.gasPrice).toBeUndefined();
    expect(tx.gasLimit).toBeUndefined();
    expect(tx.data).toBeUndefined();
  });

  it("parses hex values that carry the 0x prefix", () => {
    // value/gasPrice/gas all strip the 0x prefix before base-16 parsing
    const tx = convertEthToLiveTX({
      to: "0xrecipient",
      value: "0xff",
      gasPrice: "0xa",
      gas: "0x2",
    }) as EthWalletAPITransaction;

    expect(tx.amount).toEqual(new BigNumber(255));
    expect(tx.gasPrice).toEqual(new BigNumber(10));
    expect(tx.gasLimit).toEqual(new BigNumber(2));
  });
});
