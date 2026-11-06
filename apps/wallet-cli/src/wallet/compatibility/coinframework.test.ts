import "../../live-common-setup";
import { afterEach, describe, expect, it, spyOn } from "bun:test";
import * as coinModuleApi from "@ledgerhq/live-common/families/evm/coinModuleApi";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { BigNumberStrSchema } from "@shared/schema-primitives";
import { parseV1, toV0 } from "../../shared/accountDescriptor";
import { ETH_DESCRIPTOR } from "../../testing/constants";
import { USDT_CONTRACT, USDT_TOKEN_CURRENCY, USDT_TOKEN_INFO } from "../../testing/cal-fixtures";
import { CoinFrameworkAdapter } from "./coinframework";

const getBalance = async () => [
  { asset: { type: "native" }, value: 2_000_000_000_000_000_000n },
  { asset: { type: "erc20", assetReference: USDT_CONTRACT }, value: 1_500_000n },
];

describe("CoinFrameworkAdapter.getBalances", () => {
  const restores: Array<() => void> = [];

  afterEach(() => {
    restores.splice(0).forEach(restore => restore());
  });

  it("carries the token's metadata on each token balance", async () => {
    const api = spyOn(coinModuleApi, "createLocalEvmApi").mockReturnValue({
      getBalance,
    } as never);
    const findToken = spyOn(
      getCryptoAssetsStore(),
      "findTokenByAddressInCurrency",
    ).mockResolvedValue(USDT_TOKEN_CURRENCY);
    restores.push(
      () => api.mockRestore(),
      () => findToken.mockRestore(),
    );

    const balances = await new CoinFrameworkAdapter().getBalances(toV0(parseV1(ETH_DESCRIPTOR)));

    expect(balances).toEqual([
      {
        kind: "native",
        assetId: "ethereum",
        balance: BigNumberStrSchema.parse("2000000000000000000"),
      },
      {
        kind: "token",
        assetId: USDT_TOKEN_INFO.id,
        balance: BigNumberStrSchema.parse("1500000"),
        token: USDT_TOKEN_INFO,
        unit: USDT_TOKEN_CURRENCY.units[0],
      },
    ]);
  });
});
