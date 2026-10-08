import type { BitcoinContext } from "../../config";
import { getBalance } from "../getBalance";
import {
  EMPTIED_P2PKH,
  EMPTIED_P2WPKH,
  FUNDED_P2PKH,
  FUNDED_P2WPKH,
  OTHER_CURRENCY_ADDRESSES,
  PRISTINE_P2PKH,
  PRISTINE_P2SH_P2WPKH,
  PRISTINE_P2TR,
  PRISTINE_P2WPKH,
} from "./helpers/fixtures";

const EXPLORER_IDS: Record<string, string> = {
  bitcoin: "btc",
  litecoin: "ltc",
  digibyte: "dgb",
  dogecoin: "doge",
  zcash: "zec",
};

const liveContext: BitcoinContext = {
  config: async currencyId => ({
    status: { type: "active" },
    name: currencyId ?? "bitcoin",
    unit: { name: "unit", code: "UNIT", magnitude: 8 },
    explorer: { url: "https://explorers.api.live.ledger.com" },
    explorerId: EXPLORER_IDS[currencyId ?? "bitcoin"],
  }),
  logger: () => {},
};

describe("getBalance (live explorer)", () => {
  it.each([
    ["P2WPKH", PRISTINE_P2WPKH],
    ["P2TR", PRISTINE_P2TR],
    ["P2SH-P2WPKH", PRISTINE_P2SH_P2WPKH],
    ["P2PKH", PRISTINE_P2PKH],
  ])("returns a single native 0 balance for a pristine %s address", async (_type, address) => {
    expect(await getBalance(liveContext, "bitcoin", address)).toEqual([
      { value: 0n, asset: { type: "native" } },
    ]);
  });

  it.each([EMPTIED_P2PKH, EMPTIED_P2WPKH])(
    "returns 0 for the used then emptied address %s",
    async address => {
      expect(await getBalance(liveContext, "bitcoin", address)).toEqual([
        { value: 0n, asset: { type: "native" } },
      ]);
    },
  );

  it.each([FUNDED_P2WPKH, FUNDED_P2PKH])(
    "returns a positive native balance for the funded address %s",
    async address => {
      const balances = await getBalance(liveContext, "bitcoin", address);
      expect(balances).toHaveLength(1);
      expect(balances[0].asset).toEqual({ type: "native" });
      expect(balances[0].value).toBeGreaterThan(0n);
    },
  );

  it.each(OTHER_CURRENCY_ADDRESSES)(
    "returns a single native 0 balance on %s for %s",
    async (currencyId, address) => {
      expect(await getBalance(liveContext, currencyId, address)).toEqual([
        { value: 0n, asset: { type: "native" } },
      ]);
    },
  );
});
