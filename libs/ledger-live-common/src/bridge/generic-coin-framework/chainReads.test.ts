import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import { PortfolioApiError, type PortfolioApi } from "@ledgerhq/portfolio-module-framework";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  bindAddressLookup,
  chainReadsFor,
  fromTransactionInfoView,
  portfolioChainReads,
} from "./chainReads";
import { legacyChainReadsFor } from "./legacyChainReads";
import { openCurrencyPortfolio } from "./networkPortfolio";
import { isPortfolioEnabledFor } from "./portfolio/config";

jest.mock("./legacyChainReads", () => ({ legacyChainReadsFor: jest.fn() }));
jest.mock("./networkPortfolio", () => ({ openCurrencyPortfolio: jest.fn() }));
jest.mock("./portfolio/config", () => ({ isPortfolioEnabledFor: jest.fn(() => false) }));

const NETWORK = "ethereum";
const BLOCK_TIME = "2026-01-01T00:00:00.000Z";

const servingPortfolio = (overrides: Partial<PortfolioApi> = {}) =>
  ({
    getNextSequence: jest.fn(async () => ({ value: "12" })),
    getAccountInfo: jest.fn(async () => ({ type: "tezos", revealed: true })),
    call: jest.fn(async () => ({ result: "0xresult" })),
    getAddressesForPublicKey: jest.fn(async () => ({ addresses: ["0.0.1"] })),
    getTransactionInfo: jest.fn(async () => ({
      hash: "0xh",
      block: { height: 3, hash: "0xb", time: BLOCK_TIME },
      fee: "21",
      value: "100",
      sequence: "4",
      data: "0xdata",
    })),
    ...overrides,
  }) as unknown as PortfolioApi;

describe("portfolioChainReads", () => {
  it("reads every chain read through the portfolio, the views revived", async () => {
    const portfolio = servingPortfolio();
    const chain = portfolioChainReads({ portfolio, network: NETWORK });

    await expect(chain.getAccountInfo("tz1")).resolves.toEqual({ type: "tezos", revealed: true });
    await expect(chain.call({ to: "0x1", data: "0x2" })).resolves.toBe("0xresult");
    await expect(chain.getNextSequence("0xme")).resolves.toBe(12n);
    await expect(chain.getAddressesForPublicKey("pub")).resolves.toEqual(["0.0.1"]);
    await expect(chain.getTransactionInfo("0xh")).resolves.toEqual({
      hash: "0xh",
      block: { height: 3, hash: "0xb", time: new Date(BLOCK_TIME) },
      fee: 21n,
      value: 100n,
      sequence: 4n,
      data: "0xdata",
    });
    expect(portfolio.getAccountInfo).toHaveBeenCalledWith(NETWORK, "tz1");
    expect(portfolio.call).toHaveBeenCalledWith(NETWORK, { params: { to: "0x1", data: "0x2" } });
    expect(portfolio.getNextSequence).toHaveBeenCalledWith(NETWORK, "0xme");
    expect(portfolio.getAddressesForPublicKey).toHaveBeenCalledWith(NETWORK, "pub");
    expect(portfolio.getTransactionInfo).toHaveBeenCalledWith(NETWORK, "0xh");
  });

  it("calls the portfolio as the router it is", async () => {
    const router = {
      routed: "router",
      getNextSequence(this: { routed: string }) {
        return Promise.resolve({ value: this.routed === "router" ? "1" : "0" });
      },
    } as unknown as PortfolioApi;

    await expect(
      portfolioChainReads({ portfolio: router, network: NETWORK }).getNextSequence("a"),
    ).resolves.toBe(1n);
  });

  it("reads the account metadata once per address", async () => {
    const portfolio = servingPortfolio();
    const chain = portfolioChainReads({ portfolio, network: NETWORK });

    await Promise.all([chain.getAccountInfo("a"), chain.getAccountInfo("a")]);
    await chain.getAccountInfo("b");
    expect(portfolio.getAccountInfo).toHaveBeenCalledTimes(2);
  });

  it("answers undefined for a hash the network does not know", async () => {
    const chain = portfolioChainReads({
      portfolio: servingPortfolio({ getTransactionInfo: jest.fn(async () => undefined) }),
      network: NETWORK,
    });

    await expect(chain.getTransactionInfo("0xunknown")).resolves.toBeUndefined();
  });

  it("rejects with ChainReadUnsupportedError the extensions the portfolio does not serve", async () => {
    const chain = portfolioChainReads({
      portfolio: { getNextSequence: jest.fn() } as unknown as PortfolioApi,
      network: NETWORK,
    });

    await expect(chain.getAccountInfo("a")).rejects.toThrow(
      new ChainReadUnsupportedError("getAccountInfo is not served for ethereum"),
    );
    await expect(chain.call({})).rejects.toThrow(ChainReadUnsupportedError);
    await expect(chain.getAddressesForPublicKey("k")).rejects.toThrow(ChainReadUnsupportedError);
    await expect(chain.getTransactionInfo("h")).rejects.toThrow(ChainReadUnsupportedError);
  });

  it("reads a METHOD_NOT_ALLOWED answer as unsupported, keeping it as the cause", async () => {
    const notAllowed = new PortfolioApiError("METHOD_NOT_ALLOWED", "call is not supported");
    const chain = portfolioChainReads({
      portfolio: servingPortfolio({
        call: jest.fn(async () => Promise.reject(notAllowed)),
        getNextSequence: jest.fn(async () => Promise.reject(notAllowed)),
      }),
      network: NETWORK,
    });

    const error = await chain.call({}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ChainReadUnsupportedError);
    expect(error).toMatchObject({ message: "call is not served for ethereum", cause: notAllowed });
    await expect(chain.getNextSequence("a")).rejects.toThrow(ChainReadUnsupportedError);
  });

  it("propagates any other failure", async () => {
    const unavailable = new PortfolioApiError("UNAVAILABLE", "service down");
    const down = new Error("node down");
    const chain = portfolioChainReads({
      portfolio: servingPortfolio({
        getAccountInfo: jest.fn(async () => Promise.reject(unavailable)),
        getTransactionInfo: jest.fn(async () => Promise.reject(down)),
      }),
      network: NETWORK,
    });

    await expect(chain.getAccountInfo("a")).rejects.toBe(unavailable);
    await expect(chain.getTransactionInfo("h")).rejects.toBe(down);
  });
});

describe("fromTransactionInfoView", () => {
  it("revives a transaction not in a block, without the fields the network does not report", () => {
    expect(fromTransactionInfoView({ hash: "0xh", block: null })).toEqual({
      hash: "0xh",
      block: null,
    });
  });
});

describe("chainReadsFor", () => {
  const ethereum = getCryptoCurrencyById("ethereum");

  it("reads the legacy path's chain for a currency the portfolio layer does not serve", async () => {
    const legacy = { getNextSequence: jest.fn() };
    jest.mocked(legacyChainReadsFor).mockResolvedValue(legacy as never);

    await expect(chainReadsFor(ethereum)).resolves.toBe(legacy);
    expect(isPortfolioEnabledFor).toHaveBeenCalledWith("ethereum");
    expect(legacyChainReadsFor).toHaveBeenCalledWith(ethereum);
  });

  it("reads through the network portfolio of a portfolio-enabled currency, never around it", async () => {
    jest.mocked(isPortfolioEnabledFor).mockReturnValueOnce(true);
    jest.mocked(legacyChainReadsFor).mockClear();
    const portfolio = servingPortfolio();
    jest
      .mocked(openCurrencyPortfolio)
      .mockResolvedValue({ portfolio: portfolio as never, network: NETWORK, mode: "local" });

    const chain = await chainReadsFor(ethereum);

    expect(openCurrencyPortfolio).toHaveBeenCalledWith(ethereum, "read");
    await expect(chain.getNextSequence("0xme")).resolves.toBe(12n);
    await expect(chain.getAccountInfo("0xme")).resolves.toEqual({
      type: "tezos",
      revealed: true,
    });
    expect(portfolio.getNextSequence).toHaveBeenCalledWith(NETWORK, "0xme");
    expect(portfolio.getAccountInfo).toHaveBeenCalledWith(NETWORK, "0xme");
    expect(legacyChainReadsFor).not.toHaveBeenCalled();
  });
});

describe("bindAddressLookup", () => {
  const hedera = getCryptoCurrencyById("hedera");

  it("builds the chain reads when it looks addresses up only", async () => {
    const legacy = { getAddressesForPublicKey: jest.fn() };
    jest
      .mocked(legacyChainReadsFor)
      .mockClear()
      .mockResolvedValue(legacy as never);
    const lookup = {
      getAddresses: jest.fn(async () => ["0.0.1"]),
      keyControlsAccount: jest.fn(() => true),
    };

    const bound = bindAddressLookup(lookup, hedera);

    expect(bound.keyControlsAccount).toBe(lookup.keyControlsAccount);
    expect(legacyChainReadsFor).not.toHaveBeenCalled();
    const derived = { address: "", path: "44/3030", publicKey: "pub" };
    await expect(bound.getAddresses(derived)).resolves.toEqual(["0.0.1"]);
    expect(lookup.getAddresses).toHaveBeenCalledWith(derived, legacy);
  });
});
