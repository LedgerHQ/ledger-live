/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import React from "react";
import { render, screen, act } from "@testing-library/react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "../../mock/account";
import { BridgeSync } from "./BridgeSync";
import { setSupportedCurrencies } from "../../currencies";

const defaultsBridgeSyncOpts = {
  accounts: [],
  updateAccountWithUpdater: () => {},
  recoverError: (e) => e,
  trackAnalytics: () => {},
  prepareCurrency: () => Promise.resolve(),
  hydrateCurrency: () => Promise.resolve(),
  blacklistedTokenIds: [],
};

setSupportedCurrencies(["bitcoin"]);

describe("BridgeSync", () => {
  test("initialize without an error", async () => {
    render(<BridgeSync {...defaultsBridgeSyncOpts}>LOADED</BridgeSync>);
    expect(screen.getByText("LOADED")).not.toBeNull();
  });

  test("executes a sync at start tracked as reason=initial", async () => {
    await new Promise((resolve) => {
      const BTC = getCryptoCurrencyById("bitcoin");
      const accounts = [genAccount("btc1", { currency: BTC })];
      function track(type, opts) {
        if (type === "SyncSuccess") {
          expect(opts).toMatchObject({
            reason: "initial",
            currencyName: "Bitcoin",
          });
          resolve(null);
        }
      }
      act(() => {
        render(
          <BridgeSync
            {...defaultsBridgeSyncOpts}
            accounts={accounts}
            trackAnalytics={track}
          >
            {null}
          </BridgeSync>
        );
      });
    });
  });
});
