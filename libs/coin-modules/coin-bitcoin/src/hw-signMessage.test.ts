import BigNumber from "bignumber.js";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/index";
import { signMessage } from "./hw-signMessage";
import { BitcoinSigner } from "./signer";
import { BitcoinAccount, BitcoinResources } from "./types";

describe("signMessage", () => {
  it("returns a base64 format string", async () => {
    const signerFake = {
      getWalletXpub: jest.fn(),
      getWalletPublicKey: jest.fn(),
      signMessage: jest.fn().mockResolvedValue({
        v: 1,
        r: "407c9da9dadf23a2d7e863f51aa3512fe3c86619f1d57b16e5d0659155e83888",
        s: "207c9da9dadf736839484733637aba12fe3c86619f1d57b16e5d0659155e8388",
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
        r: "407c9da9dadf23a2d7e863f51aa3512fe3c86619f1d57b16e5d0659155e83888",
        s: "207c9da9dadf736839484733637aba12fe3c86619f1d57b16e5d0659155e8388",
      },
      signature:
        "20407c9da9dadf23a2d7e863f51aa3512fe3c86619f1d57b16e5d0659155e83888207c9da9dadf736839484733637aba12fe3c86619f1d57b16e5d0659155e8388",
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
    used: true,
    balance: account?.balance || new BigNumber(0),
    spendableBalance: account?.spendableBalance || new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 100_000,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],

    bitcoinResources,
  };
}
