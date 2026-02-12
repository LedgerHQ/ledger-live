import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { MinaCoinConfig } from "../config";
import { MinaSigner } from "../types";
import { createBridges } from ".";

describe("createBridges", () => {
  let bridges: ReturnType<typeof createBridges>;
  beforeEach(() => {
    bridges = createBridges(
      undefined as unknown as SignerContext<MinaSigner>,
      {} as unknown as MinaCoinConfig,
    );
  });

  it("has a currency bridge and an account bridge with required methods", () => {
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
      },
      currencyBridge: {
        preload: expect.any(Function),
        hydrate: expect.any(Function),
        scanAccounts: expect.any(Function),
      },
    });
  });
});
