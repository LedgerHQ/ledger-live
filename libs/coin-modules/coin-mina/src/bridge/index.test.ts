import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { SignRawOperationArg0 } from "@ledgerhq/types-live";
import { MinaCoinConfig } from "../config";
import { MinaAccount, MinaSigner } from "../types";
import { createBridges, buildCurrencyBridge, buildAccountBridge, makeCliTools } from ".";

describe("buildCurrencyBridge", () => {
  const currencyBridge = buildCurrencyBridge(undefined as unknown as SignerContext<MinaSigner>);

  it("preload resolves to empty object", async () => {
    expect(await currencyBridge.preload({} as CryptoCurrency)).toEqual({});
  });

  it("hydrate does not throw", () => {
    expect(() =>
      currencyBridge.hydrate({} as CryptoCurrency, {} as unknown as CryptoCurrency),
    ).not.toThrow();
  });
});

describe("buildAccountBridge", () => {
  const accountBridge = buildAccountBridge(undefined as unknown as SignerContext<MinaSigner>);

  it("signRawOperation is not supported", () => {
    expect(() => accountBridge.signRawOperation({} as SignRawOperationArg0<MinaAccount>)).toThrow(
      "signRawOperation is not supported",
    );
  });
});

describe("makeCliTools", () => {
  it("is a function", () => {
    expect(typeof makeCliTools).toBe("function");
  });
});

describe("createBridges", () => {
  it("returns a currency bridge and an account bridge with all required methods", () => {
    const bridges = createBridges(
      undefined as unknown as SignerContext<MinaSigner>,
      {} as unknown as MinaCoinConfig,
    );
    expect(bridges).toEqual({
      accountBridge: {
        broadcast: expect.any(Function),
        createTransaction: expect.any(Function),
        estimateMaxSpendable: expect.any(Function),
        getSerializedAddressParameters: expect.any(Function),
        getTransactionStatus: expect.any(Function),
        prepareTransaction: expect.any(Function),
        receive: expect.any(Function),
        signOperation: expect.any(Function),
        signRawOperation: expect.any(Function),
        sync: expect.any(Function),
        updateTransaction: expect.any(Function),
        validateAddress: expect.any(Function),
        assignFromAccountRaw: expect.any(Function),
        assignToAccountRaw: expect.any(Function),
      },
      currencyBridge: {
        preload: expect.any(Function),
        hydrate: expect.any(Function),
        scanAccounts: expect.any(Function),
      },
    });
  });
});
