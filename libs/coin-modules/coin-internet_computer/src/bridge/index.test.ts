import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { ICPSigner } from "../types/signer";
import { createBridges } from "./index";

describe("createBridges", () => {
  const mockSignerContext: SignerContext<ICPSigner> = jest.fn() as any;

  it("should create currency and account bridges with expected methods", () => {
    const { currencyBridge, accountBridge } = createBridges(mockSignerContext);

    expect(currencyBridge.preload).toBeInstanceOf(Function);
    expect(currencyBridge.hydrate).toBeInstanceOf(Function);
    expect(currencyBridge.scanAccounts).toBeInstanceOf(Function);

    expect(accountBridge.createTransaction).toBeInstanceOf(Function);
    expect(accountBridge.signOperation).toBeInstanceOf(Function);
    expect(accountBridge.broadcast).toBeInstanceOf(Function);
    expect(accountBridge.getTransactionStatus).toBeInstanceOf(Function);
    expect(accountBridge.estimateMaxSpendable).toBeInstanceOf(Function);
    expect(accountBridge.prepareTransaction).toBeInstanceOf(Function);
    expect(accountBridge.sync).toBeInstanceOf(Function);
    expect(accountBridge.receive).toBeInstanceOf(Function);
    expect(accountBridge.validateAddress).toBeInstanceOf(Function);
  });

  it("preload should resolve to empty object", async () => {
    const { currencyBridge } = createBridges(mockSignerContext);
    const result = await currencyBridge.preload({} as any);
    expect(result).toEqual({});
  });

  it("hydrate should be callable without error", () => {
    const { currencyBridge } = createBridges(mockSignerContext);
    expect(() => currencyBridge.hydrate({}, {} as any)).not.toThrow();
  });

  it("signRawOperation should throw", () => {
    const { accountBridge } = createBridges(mockSignerContext);
    const bridge: Record<string, (...args: unknown[]) => unknown> = accountBridge as any;
    expect(() => bridge.signRawOperation({}, {})).toThrow("signRawOperation is not supported");
  });
});
