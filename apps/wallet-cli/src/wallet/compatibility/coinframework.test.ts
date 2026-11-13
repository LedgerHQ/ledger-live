import "../../live-common-setup";
import { afterEach, describe, expect, it, spyOn } from "bun:test";
import * as coinModuleApi from "@ledgerhq/live-common/families/evm/coinModuleApi";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";
import { BigNumberStrSchema } from "@shared/schema-primitives";
import { parseV1, toV0 } from "../../shared/accountDescriptor";
import { ETH_DESCRIPTOR } from "../../testing/constants";
import { USDT_CONTRACT, USDT_TOKEN_CURRENCY, USDT_TOKEN_INFO } from "../../testing/cal-fixtures";
import type { Balance } from "../models";
import { CoinFrameworkAdapter } from "./coinframework";

const UNLISTED_CONTRACT = "0x00000000000000000000000000000000000000aa";
const NO_UNITS_CONTRACT = "0x00000000000000000000000000000000000000bb";

const erc20Asset = (assetReference: string, value: bigint) => ({
  asset: { type: "erc20", assetReference },
  value,
});

const NO_UNITS_TOKEN: TokenCurrency = {
  ...USDT_TOKEN_CURRENCY,
  id: TokenCurrencyIdSchema.parse(`ethereum/erc20/${NO_UNITS_CONTRACT}`),
  contractAddress: NO_UNITS_CONTRACT,
  units: [],
};

const CAL_BY_CONTRACT: Record<string, TokenCurrency> = {
  [USDT_CONTRACT]: USDT_TOKEN_CURRENCY,
  [NO_UNITS_CONTRACT]: NO_UNITS_TOKEN,
};

const NATIVE_BALANCE: Balance = {
  kind: "native",
  assetId: "ethereum",
  balance: BigNumberStrSchema.parse("2000000000000000000"),
};

const USDT_BALANCE: Balance = {
  kind: "token",
  assetId: USDT_TOKEN_INFO.id,
  balance: BigNumberStrSchema.parse("1500000"),
  token: USDT_TOKEN_INFO,
};

describe("CoinFrameworkAdapter.getBalances", () => {
  const restores: Array<() => void> = [];

  afterEach(() => {
    restores.splice(0).forEach(restore => restore());
  });

  const balancesHolding = async (...tokenAssets: ReturnType<typeof erc20Asset>[]) => {
    const api = spyOn(coinModuleApi, "createLocalEvmApi").mockReturnValue({
      getBalance: async () => [
        { asset: { type: "native" }, value: 2_000_000_000_000_000_000n },
        ...tokenAssets,
      ],
    } as never);
    const findToken = spyOn(
      getCryptoAssetsStore(),
      "findTokenByAddressInCurrency",
    ).mockImplementation(async address => CAL_BY_CONTRACT[address]);
    restores.push(
      () => api.mockRestore(),
      () => findToken.mockRestore(),
    );
    return new CoinFrameworkAdapter().getBalances(toV0(parseV1(ETH_DESCRIPTOR)));
  };

  it("carries the token's metadata on each token balance", async () => {
    expect(await balancesHolding(erc20Asset(USDT_CONTRACT, 1_500_000n))).toEqual({
      balances: [NATIVE_BALANCE, USDT_BALANCE],
      skippedTokenIds: [],
    });
  });

  it("returns no balance for a token CAL doesn't list", async () => {
    expect(await balancesHolding(erc20Asset(UNLISTED_CONTRACT, 1n))).toEqual({
      balances: [NATIVE_BALANCE],
      skippedTokenIds: [],
    });
  });

  it("reports a token without units as skipped and keeps the other balances", async () => {
    expect(
      await balancesHolding(
        erc20Asset(NO_UNITS_CONTRACT, 1n),
        erc20Asset(USDT_CONTRACT, 1_500_000n),
      ),
    ).toEqual({ balances: [NATIVE_BALANCE, USDT_BALANCE], skippedTokenIds: [NO_UNITS_TOKEN.id] });
  });
});
