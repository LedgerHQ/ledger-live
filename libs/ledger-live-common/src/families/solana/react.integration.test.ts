/**
 * @jest-environment jsdom
 */
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import solanaCoinConfig, { type SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { LEDGER_VALIDATOR_DEFAULT } from "@ledgerhq/coin-solana/utils";
import { getSolanaValidators } from "@ledgerhq/coin-solana/validators";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { renderHook, waitFor } from "@testing-library/react";
import "../../__tests__/test-helpers/dom-polyfill";
import { getCurrencyConfiguration } from "../../config";
import { liveConfig } from "../../config/sharedConfig";
import * as hooks from "./react";

jest.setTimeout(2 * 60 * 1000);

const currency = getCryptoCurrencyById("solana");

describe("solana/react", () => {
  describe("useValidators", () => {
    // reset once, not per test: the whole suite then costs a single fetch
    beforeAll(() => {
      LiveConfig.setConfig(liveConfig);
      solanaCoinConfig.setCoinConfig(currencyId =>
        getCurrencyConfiguration<SolanaCoinConfig>(currencyId ?? currency.id),
      );
      getSolanaValidators.reset();
    });

    // awaited directly so a network failure surfaces as the actual error
    it("fetches the validators from the API", async () => {
      const validators = await getSolanaValidators(currency.id);

      expect(validators.length).toBeGreaterThan(0);
    });

    it("exposes the fetched validators through the hook", async () => {
      const validators = await getSolanaValidators(currency.id);

      const { result } = renderHook(() => hooks.useValidators(currency));

      await waitFor(() => expect(result.current).toEqual(validators));
    });

    it("returns the Ledger validator when searching for it", async () => {
      await getSolanaValidators(currency.id);

      const { result } = renderHook(() => hooks.useValidators(currency, "Ledger"));

      await waitFor(() =>
        expect(
          result.current.some(
            validator => validator.voteAccount === LEDGER_VALIDATOR_DEFAULT.voteAccount,
          ),
        ).toBe(true),
      );
    });
  });
});
