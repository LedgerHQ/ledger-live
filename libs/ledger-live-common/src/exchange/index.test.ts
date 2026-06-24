/* eslint-env jest */
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import calService from "@ledgerhq/ledger-cal-service";
import { getEnv } from "@ledgerhq/live-env";
import { getCurrencyExchangeConfig } from ".";

jest.mock("@ledgerhq/ledger-cal-service", () => ({
  __esModule: true,
  default: { findCurrencyData: jest.fn() },
}));

jest.mock("@ledgerhq/live-env", () => ({
  ...jest.requireActual("@ledgerhq/live-env"),
  getEnv: jest.fn(),
}));

const findCurrencyData = jest.mocked(calService.findCurrencyData);
const mockedGetEnv = jest.mocked(getEnv);

describe("exchange/getCurrencyExchangeConfig", () => {
  beforeEach(() => {
    findCurrencyData.mockReset();
    findCurrencyData.mockResolvedValue({ config: "abcd", signature: "ef01" } as Awaited<
      ReturnType<typeof calService.findCurrencyData>
    >);
    mockedGetEnv.mockReturnValue(false);
  });

  it("returns the CAL config and signature as buffers", async () => {
    const res = await getCurrencyExchangeConfig({ id: "ethereum" } as CryptoCurrency);

    expect(res).toStrictEqual({
      config: Buffer.from("abcd", "hex"),
      signature: Buffer.from("ef01", "hex"),
    });
  });

  it("looks up the CAL record by the currency id for non-arc currencies", async () => {
    await getCurrencyExchangeConfig({ id: "ethereum" } as CryptoCurrency);

    expect(findCurrencyData).toHaveBeenCalledWith("ethereum", { env: "prod" });
  });

  it.each([
    ["arc_testnet", "arc_testnet/erc20/usdc_0x3600000000000000000000000000000000000000"],
    ["arc", "arc/erc20/usdc_0x0000000000000000000000000000000000000000"],
  ])("resolves %s native USDC to its token id", async (currencyId, tokenId) => {
    await getCurrencyExchangeConfig({ id: currencyId } as CryptoCurrency);

    expect(findCurrencyData).toHaveBeenCalledWith(tokenId, { env: "prod" });
  });

  it("surfaces the resolved token id when the CAL record is missing", async () => {
    findCurrencyData.mockResolvedValue(
      undefined as unknown as Awaited<ReturnType<typeof calService.findCurrencyData>>,
    );

    await expect(
      getCurrencyExchangeConfig({ id: "arc_testnet" } as CryptoCurrency),
    ).rejects.toThrow(
      "Exchange, missing configuration for arc_testnet/erc20/usdc_0x3600000000000000000000000000000000000000",
    );
  });
});
