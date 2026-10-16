import * as coinEvmStaking from "@ledgerhq/coin-evm/staking";
import { CHAIN_ID, type EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import type { ChainReads } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getCurrencyConfiguration } from "../../../config";
import { chainReadsFor } from "../../../bridge/generic-coin-framework/chainReads";
import { openCurrencyPortfolio } from "../../../bridge/generic-coin-framework/networkPortfolio";
import { getAccountReadiness } from "../bridge/api";
import * as stakingLogic from "./logic";
import { getValidators, isSeiAccountUnassociated, prefetchValidators } from "./reads";

jest.mock("@ledgerhq/coin-evm/staking", () => ({
  ...jest.requireActual("@ledgerhq/coin-evm/staking"),
  getValidators: jest.fn(),
  prefetchValidators: jest.fn(),
  isSeiAccountUnassociated: jest.fn(),
}));
jest.mock("../../../config", () => ({ getCurrencyConfiguration: jest.fn() }));
jest.mock("../../../bridge/generic-coin-framework/networkPortfolio", () => ({
  openCurrencyPortfolio: jest.fn(),
}));
jest.mock("../../../bridge/generic-coin-framework/chainReads", () => ({
  chainReadsFor: jest.fn(),
}));
jest.mock("../bridge/api", () => ({ getAccountReadiness: jest.fn() }));

const sei = getCryptoCurrencyById("sei_evm");
const legacyConfig = { chainId: CHAIN_ID.SEI_EVM } as EvmConfigInfo;
const portfolioConfig = {
  chainId: CHAIN_ID.SEI_EVM,
  portfolio: { enabled: true, mode: "local" },
} as unknown as EvmConfigInfo;
const logger = () => undefined;
const chain = { call: jest.fn() } as unknown as ChainReads;

const portfolioGetValidators = jest.fn();

/** The coin configs of the currencies: `sei_evm`'s is `seiConfig`, the others have none. */
const serveCoinConfigs = (seiConfig: EvmConfigInfo, others: Record<string, object> = {}) =>
  jest.mocked(getCurrencyConfiguration).mockImplementation(((currencyId: string) => {
    if (currencyId === "sei_evm") return seiConfig;
    if (currencyId in others) return others[currencyId];
    throw new Error(`no config for ${currencyId}`);
  }) as never);

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(openCurrencyPortfolio).mockResolvedValue({
    portfolio: { getValidators: portfolioGetValidators },
    network: "sei_evm",
    mode: "local",
  } as never);
  jest.mocked(chainReadsFor).mockResolvedValue(chain);
});

it("are the network reads the staking logic hands the screens", () => {
  expect(stakingLogic).toMatchObject({
    getValidators,
    prefetchValidators,
    isSeiAccountUnassociated,
  });
});

describe("on the legacy path", () => {
  beforeEach(() => serveCoinConfigs(legacyConfig));

  it("reads coin-evm's validators, warms its cache and checks the Sei association there", async () => {
    const page = { items: [], next: "2" };
    jest.mocked(coinEvmStaking.getValidators).mockResolvedValue(page);
    jest.mocked(coinEvmStaking.isSeiAccountUnassociated).mockResolvedValue(true);

    await expect(getValidators(legacyConfig, logger, "1")).resolves.toBe(page);
    prefetchValidators(legacyConfig, logger);
    await expect(isSeiAccountUnassociated(legacyConfig, "0xme")).resolves.toBe(true);

    expect(coinEvmStaking.getValidators).toHaveBeenCalledWith(legacyConfig, logger, "1");
    expect(coinEvmStaking.prefetchValidators).toHaveBeenCalledWith(legacyConfig, logger);
    expect(coinEvmStaking.isSeiAccountUnassociated).toHaveBeenCalledWith(legacyConfig, "0xme");
    expect(getCurrencyConfiguration).not.toHaveBeenCalled();
    expect(openCurrencyPortfolio).not.toHaveBeenCalled();
    expect(chainReadsFor).not.toHaveBeenCalled();
  });

  it("stays on coin-evm when no currency of the chain id enables the portfolio", async () => {
    // A stale config enabling the portfolio, while the chain's own coin config does not.
    jest.mocked(coinEvmStaking.isSeiAccountUnassociated).mockResolvedValue(false);

    await expect(isSeiAccountUnassociated(portfolioConfig, "0xme")).resolves.toBe(false);
    expect(coinEvmStaking.isSeiAccountUnassociated).toHaveBeenCalledWith(portfolioConfig, "0xme");
    expect(chainReadsFor).not.toHaveBeenCalled();
  });
});

describe("through the portfolio layer", () => {
  beforeEach(() =>
    serveCoinConfigs(portfolioConfig, {
      // Enables the portfolio on another chain: not the currency of the config.
      celo: { chainId: CHAIN_ID.CELO, portfolio: { enabled: true, mode: "local" } },
    }),
  );

  it("reads the validators through the portfolio of the config's currency, in coin-evm's form", async () => {
    portfolioGetValidators.mockResolvedValueOnce({
      items: [
        {
          id: "7",
          address: "0xval",
          name: "Validator",
          description: "d",
          url: "u",
          logo: "l",
          balance: "1000",
          commissionRate: "0.05",
          apy: 0.04,
        },
        { address: "0xother", name: "Other" },
      ],
      next: "page-2",
    });

    await expect(getValidators(portfolioConfig, logger)).resolves.toEqual({
      items: [
        {
          id: "7",
          address: "0xval",
          name: "Validator",
          description: "d",
          url: "u",
          logo: "l",
          balance: 1000n,
          commissionRate: "0.05",
          apy: 0.04,
        },
        // No id answered: the address, as the coin module framework has it.
        { id: "0xother", address: "0xother", name: "Other" },
      ],
      next: "page-2",
    });
    expect(openCurrencyPortfolio).toHaveBeenCalledWith(sei, "read");
    expect(portfolioGetValidators).toHaveBeenCalledWith("sei_evm", {});
    expect(coinEvmStaking.getValidators).not.toHaveBeenCalled();
  });

  it("follows the cursor, a last page answering no next one", async () => {
    portfolioGetValidators.mockResolvedValueOnce({}).mockResolvedValueOnce({ items: [] });

    await expect(getValidators(portfolioConfig, logger, "page-2")).resolves.toEqual({
      items: [],
    });
    await expect(getValidators(portfolioConfig, logger, "page-3")).resolves.toEqual({
      items: [],
    });
    expect(portfolioGetValidators.mock.calls).toEqual([
      ["sei_evm", { cursor: "page-2" }],
      ["sei_evm", { cursor: "page-3" }],
    ]);
  });

  it("warms nothing", () => {
    prefetchValidators(portfolioConfig, logger);
    expect(coinEvmStaking.prefetchValidators).not.toHaveBeenCalled();
  });

  it.each([
    [{ ready: false, reason: "activationRequired" }, true],
    [{ ready: true }, false],
  ] as const)(
    "answers the Sei association from the readiness of the portfolio's chain reads (%o)",
    async (readiness, unassociated) => {
      jest.mocked(getAccountReadiness).mockResolvedValue(readiness);

      await expect(isSeiAccountUnassociated(portfolioConfig, "0xme")).resolves.toBe(unassociated);
      expect(chainReadsFor).toHaveBeenCalledWith(sei);
      expect(getAccountReadiness).toHaveBeenCalledWith(sei, "0xme", chain);
      expect(coinEvmStaking.isSeiAccountUnassociated).not.toHaveBeenCalled();
    },
  );

  it("shows no warning when the portfolio cannot make the call, and fails otherwise", async () => {
    jest
      .mocked(getAccountReadiness)
      .mockRejectedValueOnce(new ChainReadUnsupportedError("call is not served for sei_evm"));
    await expect(isSeiAccountUnassociated(portfolioConfig, "0xme")).resolves.toBe(false);

    const failure = new Error("portfolio down");
    jest.mocked(chainReadsFor).mockRejectedValueOnce(failure);
    await expect(isSeiAccountUnassociated(portfolioConfig, "0xme")).rejects.toBe(failure);
  });
});
