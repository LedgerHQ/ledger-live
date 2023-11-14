import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";
import { Account } from "@ledgerhq/types-live";
import type { Transaction as EvmTransaction } from "../../../types/index";
import { getFormattedFeeFields } from "../../../editTransaction/getFormattedFeeFields";
import BigNumber from "bignumber.js";

const dummyType2Transaction = {
  type: 2,
  maxFeePerGas: new BigNumber("2000000000"),
  maxPriorityFeePerGas: new BigNumber("1000000000"),
  gasLimit: new BigNumber("21000"),
} as EvmTransaction;

const dummyType0Transaction = {
  type: 0,
  gasPrice: new BigNumber("5000000000"),
  gasLimit: new BigNumber("21000"),
} as EvmTransaction;

/**
 * Testing on all evm currencies might be overkill and trigger some snapshots
 * updates when a new currency is added.
 * But that's the most exaustive way to test that the getFormattedFeeFields
 * function works as expected for all currencies.
 */
const testCases: {
  currencyName: string;
  account: Account;
  type2Transaction: EvmTransaction;
  type0Transaction: EvmTransaction;
}[] = Object.values(cryptocurrenciesById)
  .filter(currency => currency.family === "evm")
  .map(currency => {
    return {
      currencyName: currency.name,
      account: { type: "Account", currency, unit: currency.units[0] } as Account,
      type2Transaction: dummyType2Transaction,
      type0Transaction: dummyType0Transaction,
    };
  });

const localeTestCases = [
  "en-US",
  "fr-FR",
  "es-ES",
  "de-DE",
  "ja-JP",
  "ko-KR",
  "pt-BR",
  "ru-RU",
  "tr-TR",
  "zh-CN",
];

describe("getFormattedFeeFields", () => {
  describe("with tx type 2", () => {
    describe.each(localeTestCases)("with locale %s", locale => {
      test.each(testCases)(
        "should correctly format fee fields for $currencyName unit",
        ({ account, type2Transaction }) => {
          const type2FeeFields = getFormattedFeeFields({
            transaction: type2Transaction,
            mainAccount: account,
            locale,
          });
          expect(type2FeeFields).toMatchSnapshot();
        },
      );
    });
  });

  describe("with tx type 0", () => {
    describe.each(localeTestCases)("with locale %s", locale => {
      test.each(testCases)(
        "should correctly format fee fields for $currencyName unit",
        ({ account, type0Transaction }) => {
          const type0FeeFields = getFormattedFeeFields({
            transaction: type0Transaction,
            mainAccount: account,
            locale,
          });
          expect(type0FeeFields).toMatchSnapshot();
        },
      );
    });
  });
});
