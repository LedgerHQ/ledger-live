import { HEDERA_DUMMY_ADDRESS } from "../constants";
import { createBridges } from "./index";

jest.mock("../config");
jest.mock("../preload", () => ({
  preload: jest.fn(),
  hydrate: jest.fn(),
  getPreloadStrategy: jest.fn(),
}));
jest.mock("../signer/index", () => jest.fn(() => jest.fn()));
jest.mock("./signOperation", () => ({ buildSignOperation: jest.fn(() => jest.fn()) }));
jest.mock("./synchronisation", () => ({
  getAccountShape: jest.fn(),
  buildIterateResult: jest.fn(),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/bridge/jsHelpers", () => ({
  getSerializedAddressParameters: jest.fn(),
  makeScanAccounts: jest.fn(() => jest.fn()),
  makeSync: jest.fn(() => jest.fn()),
  updateTransaction: jest.fn(),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper", () =>
  jest.fn(() => jest.fn()),
);

describe("createBridges", () => {
  const signerContext = jest.fn();
  const coinConfig = jest.fn(() => ({})) as never;

  it("accountBridge.signRawOperation throws an error", () => {
    const { accountBridge } = createBridges(signerContext, coinConfig);
    expect(() => accountBridge.signRawOperation?.(undefined as never)).toThrow(
      "signRawOperation is not supported",
    );
  });

  it("accountBridge.getEstimationRecipient returns HEDERA_DUMMY_ADDRESS", () => {
    const { accountBridge } = createBridges(signerContext, coinConfig);
    expect(accountBridge.getEstimationRecipient?.(undefined as never)).toBe(HEDERA_DUMMY_ADDRESS);
  });
});
