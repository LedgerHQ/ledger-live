import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import createFixtureCryptoCurrency from "../../mock/fixtures/cryptoCurrencies";
import { TypedMessageData } from "../../families/ethereum/types";
import { prepareMessageToSign } from "./index";
import { MessageData } from "./types";

const signResult = {
  message: "Sign results",
  rawMessage: "Sign raw results",
};
const signFunction = jest.fn(() => signResult);
jest.mock("../../generated/hw-signMessage", () => {
  return {
    signExistFamily: {
      prepareMessageToSign: function () {
        return signFunction();
      },
    },
  };
});

describe("prepareMessageToSign", () => {
  it("calls the perFamily function if it's exist and returns this function results", () => {
    // Given
    const crypto = createFixtureCryptoCurrency("signExistFamily");
    const account = createAccount(crypto);
    const message = "whatever";

    // When
    let result: MessageData | TypedMessageData | undefined;
    let error: unknown = null;
    try {
      result = prepareMessageToSign(account, message);
    } catch (err) {
      error = err;
    }

    // Then
    expect(error).toBeNull();
    expect(signFunction).toBeCalledTimes(1);
    expect(result).toEqual(signResult);
  });

  it("returns an error if account is not linked to a crypto able to sign a message", () => {
    // Given
    const crypto = createFixtureCryptoCurrency("mycoin");
    const account = createAccount(crypto);
    const message = "whatever";

    // When
    let result: MessageData | TypedMessageData | undefined;
    let error: Error | null = null;
    try {
      result = prepareMessageToSign(account, message);
    } catch (err) {
      error = err as Error;
    }

    // Then
    expect(result).toBeUndefined();
    expect(error).toEqual(Error("Crypto does not support signMessage"));
  });
});

const createAccount = (crypto: CryptoCurrency): Account => ({
  type: "Account",
  id: "ethereumjs:2:ethereum:0x01:",
  seedIdentifier: "0x01",
  derivationMode: "ethM",
  index: 0,
  freshAddress: "0x01",
  freshAddressPath: "44'/60'/0'/0/0",
  freshAddresses: [],
  name: "Ethereum 1",
  starred: false,
  used: false,
  balance: new BigNumber("51281813126095913"),
  spendableBalance: new BigNumber("51281813126095913"),
  creationDate: new Date(),
  blockHeight: 8168983,
  currency: crypto,
  unit: {
    name: "satoshi",
    code: "BTC",
    magnitude: 5,
  },
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  balanceHistoryCache: {
    HOUR: {
      balances: [],
      latestDate: undefined,
    },
    DAY: {
      balances: [],
      latestDate: undefined,
    },
    WEEK: {
      balances: [],
      latestDate: undefined,
    },
  },
  swapHistory: [],
});
