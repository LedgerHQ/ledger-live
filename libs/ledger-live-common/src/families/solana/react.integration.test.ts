/**
 * @jest-environment jsdom
 */
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { LEDGER_VALIDATOR_BY_FIGMENT } from "@ledgerhq/coin-solana/constants";
import { getSolanaValidators } from "@ledgerhq/coin-solana/validators";
import { renderHook, waitFor } from "@testing-library/react";
import "../../__tests__/test-helpers/dom-polyfill";
import * as hooks from "./react";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";
import { solanaConfig } from "./config";

LiveConfig.setConfig(solanaConfig);

jest.setTimeout(2 * 60 * 1000);

const currency = getCryptoCurrencyById("solana");

describe("solana/react", () => {
  describe("useValidators", () => {
    // reset once, not per test: the whole suite then costs a single fetch
    beforeAll(() => {
      getSolanaValidators.reset();
    });

    // awaited directly so a network failure surfaces as the actual error
    it("fetches the validators from the API", async () => {
      const validators = await getSolanaValidators(
        buildContext<SolanaCoinConfig>(currency.id),
        currency.id,
      );

      expect(validators.length).toBeGreaterThan(0);
    });

    it("exposes the fetched validators through the hook", async () => {
      const validators = await getSolanaValidators(
        buildContext<SolanaCoinConfig>(currency.id),
        currency.id,
      );

      const { result } = renderHook(() => hooks.useValidators(currency));

      await waitFor(() => expect(result.current).toEqual(validators));
    });

    it("returns the Ledger validator when searching for it", async () => {
      await getSolanaValidators(buildContext<SolanaCoinConfig>(currency.id), currency.id);

      const { result } = renderHook(() => hooks.useValidators(currency, "Ledger"));

      await waitFor(() =>
        expect(
          result.current.some(
            validator => validator.voteAccount === LEDGER_VALIDATOR_BY_FIGMENT.voteAccount,
          ),
        ).toBe(true),
      );
    });
  });
});
