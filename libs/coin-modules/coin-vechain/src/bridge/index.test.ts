import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { getCoinConfig } from "../config";
import type { VechainSigner } from "../types";
import { createBridges } from "./index";

const signerContext: SignerContext<VechainSigner> = (_deviceId, fn) =>
  fn({
    getAddress: jest.fn(),
    signTransaction: jest.fn(),
  });

describe("createBridges", () => {
  it("sets the coin config so downstream logic (e.g. createTransaction) can read it", () => {
    createBridges(signerContext, () => ({
      status: { type: "active" },
      node: { url: "https://vechain.coin.ledger.com" },
      chainTag: 39,
    }));

    expect(getCoinConfig()).toEqual({
      status: { type: "active" },
      node: { url: "https://vechain.coin.ledger.com" },
      chainTag: 39,
    });
  });

  it("returns a currencyBridge and an accountBridge", () => {
    const { currencyBridge, accountBridge } = createBridges(signerContext, () => ({
      status: { type: "active" },
      node: { url: "https://vechain.coin.ledger.com" },
    }));

    expect(currencyBridge.scanAccounts).toBeInstanceOf(Function);
    expect(accountBridge.createTransaction).toBeInstanceOf(Function);
    expect(accountBridge.broadcast).toBeInstanceOf(Function);
  });
});
