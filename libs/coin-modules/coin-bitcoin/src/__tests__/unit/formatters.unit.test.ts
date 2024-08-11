import BigNumber from "bignumber.js";

import { BitcoinOutput } from "../../types";
import formatters from "../../formatters";

import { createFixtureAccount } from "../fixtures/common.fixtures";

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn().mockReturnValue(3),
  changes: {
    subscribe: jest.fn(),
  },
}));
jest.mock("./wallet-btc", () => ({
  ...jest.requireActual("./wallet-btc"),
  getWalletAccount: jest.fn().mockReturnValue({
    xpub: {
      crypto: "bitcoin",
    },
  }),
}));


describe("formatAccountSpecifics", () => {
  const mockAccount = createFixtureAccount();

  it("should return an empty string if bitcoinResources is empty", () => {
    const result = formatters.formatAccountSpecifics({
      ...mockAccount,
    });
    expect(result).toContain("0 UTXOs");
  });

  it("should return a string with the number of UTXOs", () => {
    // getEnv.mockReturnValue(2);
    const result = formatters.formatAccountSpecifics({
      ...mockAccount,
      bitcoinResources: {
        utxos: [
          { hash: "0x3333", value: new BigNumber(1) },
          { hash: "0x4444", value: new BigNumber(3) },
        ] as BitcoinOutput[],
      },
    });
    expect(result).toContain("2 UTXOs");
  });

  it("should display all UTXOs if the number of UTXOs is less than or equal to DEBUG_UTXO_DISPLAY", () => {
    const result = formatters.formatAccountSpecifics({
      ...mockAccount,
      bitcoinResources: {
        utxos: [
          { hash: "0x3333", value: new BigNumber(1) },
          { hash: "0x4444", value: new BigNumber(3) },
        ] as BitcoinOutput[],
      },
    });
    expect(result).not.toContain("...");
  });

  it("should not display all UTXOs if the number of UTXOs is greater than DEBUG_UTXO_DISPLAY", () => {
    const account = {
      bitcoinResources: {
        utxos: [1, 2, 3, 4, 5],
      },
    };
    // getEnv.mockReturnValue(3);
    const result = formatters.formatAccountSpecifics({
      ...mockAccount,
      bitcoinResources: {
        utxos: [
          { hash: "0x1111", value: new BigNumber(1) },
          { hash: "0x2222", value: new BigNumber(2) },
          { hash: "0x3333", value: new BigNumber(3) },
          { hash: "0x4444", value: new BigNumber(4) },
          { hash: "0x5555", value: new BigNumber(5) },
        ] as BitcoinOutput[],
      },
    });
    expect(result).toContain("...");
  });
});
