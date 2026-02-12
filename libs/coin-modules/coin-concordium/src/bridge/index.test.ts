import { createBridges } from ".";

describe("createBridges", () => {
  it("has a currency bridge and an account bridge with required methods", () => {
    expect(createBridges(undefined as any, {} as any)).toEqual({
      accountBridge: {
        assignFromAccountRaw: expect.any(Function),
        assignToAccountRaw: expect.any(Function),
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
      },
      currencyBridge: {
        hydrate: expect.any(Function),
        onboardAccount: expect.any(Function),
        pairWalletConnect: expect.any(Function),
        preload: expect.any(Function),
        scanAccounts: expect.any(Function),
      },
    });
  });
});
