import { checksumAddress } from "../encoding";
import { balanceRow } from "../kinds/balance";
import { randomAmount, randomBytes } from "../random";
import type { MockFamily } from "./types";

type MockToken = { id: string; magnitude: number; odds: number; min: number; max: number };

/** Tokens a mock account may hold, per network, and how often. */
const TOKENS: Partial<Record<string, readonly MockToken[]>> = {
  ethereum: [
    { id: "ethereum/erc20/usd__coin", magnitude: 6, odds: 0.5, min: 5, max: 20_000 },
    { id: "ethereum/erc20/usd_tether__erc20_", magnitude: 6, odds: 0.4, min: 5, max: 20_000 },
  ],
};

/** Ledger Live derivation; the native coin first, then the tokens the account holds. */
export const evm: MockFamily = {
  descriptor: (currency, index, random) => ({
    purpose: "mock",
    version: "2",
    type: "address",
    network: currency.id,
    address: checksumAddress(randomBytes(random, 20)),
    path: `m/44h/${currency.coinType}h/${index}h/0/0`,
  }),
  read: {
    balance: ({ currency, random }) => {
      const native =
        random() < 0.1 ? 0n : randomAmount(random, currency.units[0].magnitude, 0.005, 5);
      const tokens = (TOKENS[currency.id] ?? []).flatMap(token =>
        random() < token.odds
          ? [balanceRow(token.id, randomAmount(random, token.magnitude, token.min, token.max))]
          : [],
      );
      return [balanceRow(currency.id, native), ...tokens];
    },
  },
};
