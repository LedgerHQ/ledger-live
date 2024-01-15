/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import React from "react";
import { render, screen } from "@testing-library/react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "../../mock/account";
import { BridgeSync } from "./BridgeSync";
import { setSupportedCurrencies } from "../../currencies";
import { getAccountBridge } from "..";

jest.setTimeout(30000);

const defaultsBridgeSyncOpts = {
  accounts: [],
  updateAccountWithUpdater: () => {},
  recoverError: e => e,
  trackAnalytics: () => {},
  prepareCurrency: () => Promise.resolve(),
  hydrateCurrency: () => Promise.resolve(),
  blacklistedTokenIds: [],
};

setSupportedCurrencies(["bitcoin", "ethereum"]);

describe("BridgeSync", () => {
  test("initialize without an error", async () => {
    render(<BridgeSync {...defaultsBridgeSyncOpts}>LOADED</BridgeSync>);
    expect(screen.getByText("LOADED")).not.toBeNull();
  });

  test("executes a sync at start tracked as reason=initial", async () => {
    await new Promise(resolve => {
      const BTC = getCryptoCurrencyById("bitcoin");
      const account = genAccount("btc1", { currency: BTC });
      const futureOpLength = account.operations.length;
      // we remove the first operation to feed it back as a broadcasted one, the mock impl will make it go back to operations
      const lastOp = account.operations.splice(0, 1)[0];
      getAccountBridge(account).broadcast({
        account,
        signedOperation: {
          operation: lastOp,
          signature: "",
        },
      });
      const accounts = [account];
      expect(accounts[0].operations.length).toBe(futureOpLength - 1);

      function track(type, opts) {
        if (type === "SyncSuccess") {
          expect(opts).toMatchObject({
            reason: "initial",
            currencyName: "Bitcoin",
            operationsLength: futureOpLength,
          });
          resolve(null);
        }
      }
      render(
        <BridgeSync {...defaultsBridgeSyncOpts} accounts={accounts} trackAnalytics={track}>
          {null}
        </BridgeSync>,
      );
    });
  });

  test("sync all accounts in parallel at start tracked as reason=initial", async () => {
    await new Promise(resolve => {
      const BTC = getCryptoCurrencyById("bitcoin");
      const ETH = getCryptoCurrencyById("ethereum");
      const accounts = [
        genAccount("2btc1", { currency: BTC }),
        genAccount("2btc2", { currency: BTC }),
        genAccount("2eth1", { currency: ETH }),
      ];
      const synced: Array<any> = [];
      let resolveFirst;
      function prepareCurrency() {
        if (!resolveFirst) {
          return new Promise((resolve, reject) => {
            resolveFirst = resolve;
            setTimeout(
              reject,
              5000,
              new Error("prepareCurrency doesn't seem to be called in parallel"),
            );
          });
        }
        // if we reach here, it means, we managed to have
        // a SECOND sync that need to prepare currency
        // so it's a proof that sync correctly runs in parallel
        // otherwise it would timeout
        resolveFirst();
        return Promise.resolve();
      }
      function track(type, opts) {
        expect(type).not.toEqual("SyncError");
        if (type === "SyncSuccess") {
          synced.push(opts);
          expect(opts).toMatchObject({
            reason: "initial",
          });
          if (synced.length === accounts.length) resolve(null);
        }
      }
      render(
        <BridgeSync
          {...defaultsBridgeSyncOpts}
          prepareCurrency={prepareCurrency}
          accounts={accounts}
          trackAnalytics={track}
        >
          {null}
        </BridgeSync>,
      );
    });
  });
});
