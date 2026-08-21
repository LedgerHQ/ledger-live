import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
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

    it("answers for an account whose shielded sync was never activated", () => {
      const result = extensions.getWalletApiSpendableBalance?.(
        makeAccount({ privateInfo: undefined }),
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
