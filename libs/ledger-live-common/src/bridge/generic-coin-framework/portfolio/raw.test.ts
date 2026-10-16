import { isUnsupported } from "@ledgerhq/portfolio-module-framework";
import { createPortfolioServiceClient } from "@ledgerhq/portfolio-module-portfolio-service";
import {
  ADDRESS,
  fakeCoinModule,
  mockLiveConfig,
  portfolioCoinConfig,
  rippleAccount,
  type FakeCoinModule,
} from "../tests/portfolioFixtures";
import { openNetworkPortfolio } from "./network";
import { rawWriteApi } from "./raw";

jest.mock("@ledgerhq/portfolio-module-portfolio-service", () => ({
  createPortfolioServiceClient: jest.fn(),
}));
jest.mock("./network", () => {
  const actual = jest.requireActual("./network");
  return { ...actual, openNetworkPortfolio: jest.fn(actual.openNetworkPortfolio) };
});

let coinModule: FakeCoinModule & { craftRawTransaction: jest.Mock };

function configure(mode: "local" | "remote" | undefined): void {
  mockLiveConfig({
    config_portfolio_service: { url: "https://portfolio.test", portfolioId: "wallet" },
    config_currency_ripple: mode ? portfolioCoinConfig(mode) : { status: { type: "active" } },
  });
}

/** Every write of a raw signing, in the order the bridge makes them. */
async function signRaw(api: ReturnType<typeof rawWriteApi>) {
  const sequence = await api.getNextSequence(ADDRESS);
  const unsigned = await api.craftRawTransaction("0a01", ADDRESS, "02pub", sequence);
  const signed = await api.combine(unsigned, "device-sig", "02pub");
  return { sequence, unsigned, signed };
}

beforeEach(() => {
  jest.clearAllMocks();
  coinModule = {
    ...fakeCoinModule(),
    craftRawTransaction: jest.fn(
      async (
        _context: unknown,
        transaction: string,
        _sender: string,
        _pk: string,
        seq: bigint,
      ) => ({
        transaction: `raw-${transaction}-${seq}`,
        details: { size: 1n },
      }),
    ),
  };
});

afterEach(() => jest.restoreAllMocks());

describe("rawWriteApi", () => {
  it("signs with the coin module on the legacy path", async () => {
    configure(undefined);

    await expect(signRaw(rawWriteApi(coinModule as never, rippleAccount()))).resolves.toEqual({
      sequence: 7n,
      unsigned: "raw-0a01-7",
      signed: "raw-0a01-7+device-sig",
    });

    expect(coinModule.getNextSequence).toHaveBeenCalledWith(expect.anything(), ADDRESS);
    expect(coinModule.craftRawTransaction).toHaveBeenCalledWith(
      expect.anything(),
      "0a01",
      ADDRESS,
      "02pub",
      7n,
    );
    expect(coinModule.combine).toHaveBeenCalledWith(
      expect.anything(),
      "raw-0a01-7",
      ["device-sig"],
      {
        pubkey: "02pub",
      },
    );
    expect(openNetworkPortfolio).not.toHaveBeenCalled();
  });

  it("signs through the side writing for the chain when the coin config enables the portfolio", async () => {
    configure("local");
    const binding = { create: jest.fn() };
    const bridgeApi = { accountModule: binding as never, getTokenFromAsset: jest.fn() };

    await expect(
      signRaw(rawWriteApi(coinModule as never, rippleAccount(), bridgeApi)),
    ).resolves.toEqual({
      sequence: 7n,
      unsigned: "raw-0a01-7",
      signed: "raw-0a01-7+device-sig",
    });

    // The local side reads the sequence and wraps the transaction with it, as handed over.
    expect(coinModule.getNextSequence).toHaveBeenCalledTimes(1);
    expect(coinModule.craftRawTransaction).toHaveBeenCalledWith(
      expect.anything(),
      "0a01",
      ADDRESS,
      "02pub",
      7n,
    );
    expect(coinModule.combine).toHaveBeenCalledWith(
      expect.anything(),
      "raw-0a01-7",
      ["device-sig"],
      {
        pubkey: "02pub",
      },
    );
    // One portfolio for the whole signing, wired on the family's modules.
    expect(openNetworkPortfolio).toHaveBeenCalledTimes(1);
    expect(openNetworkPortfolio).toHaveBeenCalledWith(
      rippleAccount().currency,
      { binding, coinModuleApi: coinModule, context: expect.anything(), bridgeApi },
      "write",
    );
    expect(binding.create).toHaveBeenCalledWith(coinModule, "ripple");
  });

  it("fails explicitly where the service writes for the chain: it wraps no raw transaction", async () => {
    configure("remote");
    const service = {
      getNextSequence: jest.fn(async () => ({ value: "9" })),
      combineTransaction: jest.fn(async () => ({ signedTransaction: "service-signed" })),
    };
    (createPortfolioServiceClient as jest.Mock).mockReturnValue(service);
    const api = rawWriteApi(coinModule as never, rippleAccount());

    await expect(api.getNextSequence(ADDRESS)).resolves.toBe(9n);
    expect(service.getNextSequence).toHaveBeenCalledWith("xrp", ADDRESS);
    const failure = await api.craftRawTransaction("0a01", ADDRESS, "02pub", 9n).catch(e => e);
    expect(isUnsupported(failure)).toBe(true);
    await expect(api.combine("raw", "sig", "02pub")).resolves.toBe("service-signed");
    expect(service.combineTransaction).toHaveBeenCalledWith("xrp", {
      rawTransaction: "raw",
      signature: "sig",
      pubkey: "02pub",
    });
    expect(coinModule.craftRawTransaction).not.toHaveBeenCalled();
  });
});
