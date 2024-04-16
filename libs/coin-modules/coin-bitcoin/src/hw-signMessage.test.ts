import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { signMessage } from "./hw-signMessage";
import { BitcoinSigner } from "./signer";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/index";
import { BitcoinAccount, BitcoinResources } from "./types";
import BigNumber from "bignumber.js";

describe("signMessage", () => {
  it("returns a base64 format string", async () => {
    const signerFake = {
      getWalletXpub: jest.fn(),
      getWalletPublicKey: jest.fn(),
      signMessage: jest.fn().mockResolvedValue({
        v: 1,
        r: "RRRRRSSSSSRRRRRSSSSS",
        s: "SSSSSRRRRRSSSSSRRRRR",
      }),
      splitTransaction: jest.fn(),
      createPaymentTransaction: jest.fn(),
    };
    const signerContext = <T>(
      _deviceId: string,
      _crypto: CryptoCurrency,
      fn: (signer: BitcoinSigner) => Promise<T>,
    ): Promise<T> => fn(signerFake);

    const account = createFixtureAccount();

    const signature = await signMessage(signerContext)("deviceId", account, {
      message: "MESSAGE_TO_SIGN",
    });

    expect(signerFake.signMessage).toHaveBeenCalledTimes(1);
    expect(signature).toEqual({
      rsv: {
        v: 1,
        r: "RRRRRSSSSSRRRRRSSSSS",
        s: "SSSSSRRRRRSSSSSRRRRR",
      },
      signature: "IA==",
    });
  });
});

function createFixtureAccount(account?: Partial<BitcoinAccount>): BitcoinAccount {
  const currency = listCryptoCurrencies(true).find(c => c.id === "bitcoin")!;

  const bitcoinResources: BitcoinResources = account?.bitcoinResources || {
    utxos: [],
  };

  const freshAddress = {
    address: "1fMK6i7CMDES1GNGDEMX5ddDaxbkjWPw1M",
    derivationPath: "derivation_path",
  };

  return {
    type: "Account",
    id: "E0A538D5-5EE7-4E37-BB57-F373B08B8580",
    seedIdentifier: "FD5EAFE3-8C7F-4565-ADFA-2A1A2067322A",
    derivationMode: "",
    index: 0,
    freshAddress: freshAddress.address,
    freshAddressPath: freshAddress.derivationPath,
    freshAddresses: [freshAddress],
    name: "bitcoin account name",
    starred: false,
    used: true,
    balance: account?.balance || new BigNumber(0),
    spendableBalance: account?.spendableBalance || new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 100_000,
    currency,
    unit: currency.units[0],
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],

    bitcoinResources,
  };
}

const emptyHistoryCache = {
  HOUR: {
    latestDate: null,
    balances: [],
  },
  DAY: {
    latestDate: null,
    balances: [],
  },
  WEEK: {
    latestDate: null,
    balances: [],
  },
};
