import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { ZCASH_MAX_TRANSPARENT_INPUTS } from "@ledgerhq/coin-zcash/constants";
import { setZcashShieldedEnabled } from "../../bridge/zcashRouting";
import extensions from "./bridgeExtensions";

// Only the fields the extension reads: the account type, the currency, and the
// transparent UTXO set. `balance`/`spendableBalance` hold the transparent +
// private total the coin module writes, so a test asserting the transparent
// figure also proves the extension does not read them.
const makeAccount = (patch: Record<string, unknown> = {}): AccountLike =>
  ({
    type: "Account",
    currency: { id: "zcash" },
    balance: new BigNumber(4_976_022),
    spendableBalance: new BigNumber(4_976_022),
    bitcoinResources: {
      utxos: [{ value: new BigNumber(4_000_000) }, { value: new BigNumber(590_920) }],
    },
    privateInfo: { ironwoodBalance: new BigNumber(385_102) },
    ...patch,
  }) as unknown as AccountLike;

describe("zcash bridgeExtensions", () => {
  describe("getWalletApiSpendableBalance", () => {
    it("returns the transparent balance only, leaving the private pool out", () => {
      const result = extensions.getWalletApiSpendableBalance?.(makeAccount());

      expect(result).toEqual(new BigNumber(4_590_920));
    });

    it("reports zero when every fund the account holds is private", () => {
      const result = extensions.getWalletApiSpendableBalance?.(
        makeAccount({ bitcoinResources: { utxos: [] } }),
      );

      expect(result).toEqual(new BigNumber(0));
    });

    it("reports zero when the account has not been synced yet", () => {
      const result = extensions.getWalletApiSpendableBalance?.(
        makeAccount({ bitcoinResources: undefined }),
      );

      expect(result).toEqual(new BigNumber(0));
    });

    describe("with the shielded engine on", () => {
      beforeEach(() => setZcashShieldedEnabled(true));
      afterEach(() => setZcashShieldedEnabled(false));

      it("reports every UTXO when the account holds exactly as many as one transaction can spend", () => {
        const utxos = Array.from({ length: ZCASH_MAX_TRANSPARENT_INPUTS }, (_, i) => ({
          value: new BigNumber(1_000 + i),
        }));

        const result = extensions.getWalletApiSpendableBalance?.(
          makeAccount({ bitcoinResources: { utxos } }),
        );

        expect(result).toEqual(utxos.reduce((sum, utxo) => sum.plus(utxo.value), new BigNumber(0)));
      });

      it("caps the balance at the largest UTXOs one transaction can spend", () => {
        // Two small UTXOs first, so a bound that kept the first N instead of the
        // largest N would report a different figure.
        const small = [{ value: new BigNumber(10) }, { value: new BigNumber(20) }];
        const large = Array.from({ length: ZCASH_MAX_TRANSPARENT_INPUTS }, () => ({
          value: new BigNumber(100_000),
        }));

        const result = extensions.getWalletApiSpendableBalance?.(
          makeAccount({ bitcoinResources: { utxos: [...small, ...large] } }),
        );

        expect(result).toEqual(new BigNumber(100_000 * ZCASH_MAX_TRANSPARENT_INPUTS));
      });
    });

    it("reports every UTXO past the input ceiling on the transparent-only path", () => {
      const utxos = Array.from({ length: ZCASH_MAX_TRANSPARENT_INPUTS + 2 }, () => ({
        value: new BigNumber(100_000),
      }));

      const result = extensions.getWalletApiSpendableBalance?.(
        makeAccount({ bitcoinResources: { utxos } }),
      );

      expect(result).toEqual(new BigNumber(100_000 * (ZCASH_MAX_TRANSPARENT_INPUTS + 2)));
    });

    it("answers for an account whose shielded sync was never activated", () => {
      const result = extensions.getWalletApiSpendableBalance?.(
        makeAccount({ privateInfo: undefined }),
      );

      expect(result).toEqual(new BigNumber(4_590_920));
    });

    it("answers for a zcash testnet account", () => {
      const result = extensions.getWalletApiSpendableBalance?.(
        makeAccount({ currency: { id: "zcash_testnet" } }),
      );

      expect(result).toEqual(new BigNumber(4_590_920));
    });

    it("throws when the account is not a zcash account", () => {
      const account = makeAccount({ currency: { id: "bitcoin" } });

      expect(() => extensions.getWalletApiSpendableBalance?.(account)).toThrow(
        "zcash: invalid account in bridgeExtensions",
      );
    });

    it("throws for a token account", () => {
      const account = makeAccount({ type: "TokenAccount" });

      expect(() => extensions.getWalletApiSpendableBalance?.(account)).toThrow(
        "zcash: invalid account in bridgeExtensions",
      );
    });
  });
});
