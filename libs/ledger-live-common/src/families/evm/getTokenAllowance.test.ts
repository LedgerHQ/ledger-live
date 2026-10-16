import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createApi } from "@ledgerhq/coin-evm/api";
import { getNodeApi } from "@ledgerhq/coin-evm/network";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { openCurrencyPortfolio } from "../../bridge/generic-coin-framework/networkPortfolio";
import { isPortfolioEnabledFor } from "../../bridge/generic-coin-framework/portfolio/config";
import { getEvmTokenAllowance } from "./getTokenAllowance";

jest.mock("@ledgerhq/coin-evm/api", () => ({ createApi: jest.fn() }));
jest.mock("@ledgerhq/coin-evm/network", () => ({ getNodeApi: jest.fn() }));
jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore", () => ({
  getCryptoAssetsStore: jest.fn(),
}));
jest.mock("../../bridge/generic-coin-framework/api/context", () => ({
  buildContext: jest.fn(() => ({ config: async () => ({ node: {} }), logger: jest.fn() })),
}));
jest.mock("../../bridge/generic-coin-framework/networkPortfolio", () => ({
  openCurrencyPortfolio: jest.fn(),
}));
jest.mock("../../bridge/generic-coin-framework/portfolio/config", () => ({
  isPortfolioEnabledFor: jest.fn(() => false),
}));

const ethereum = getCryptoCurrencyById("ethereum");
const OWNER = "0x055c1e159e345cb4197e3844a86a61e0a801d856";
const SPENDER = "0x1111111254eeb25477b68fb85ed929f73a960582";
const CONTRACT = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const usdt = {
  id: "ethereum/erc20/usd_tether__erc20_",
  parentCurrencyId: "ethereum",
  contractAddress: CONTRACT,
  ticker: "USDT",
  units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
};

const account = (currency = ethereum): Account =>
  ({ type: "Account", currency, freshAddress: OWNER }) as unknown as Account;

const findTokenById = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(isPortfolioEnabledFor).mockReturnValue(false);
  jest.mocked(getCryptoAssetsStore).mockReturnValue({ findTokenById } as never);
  findTokenById.mockResolvedValue(usdt);
});

describe("getEvmTokenAllowance", () => {
  it("refuses an account of another family", async () => {
    await expect(
      getEvmTokenAllowance(account(getCryptoCurrencyById("bitcoin")), usdt.id, SPENDER),
    ).rejects.toThrow('The account currency must be EVM (family "evm"); received: "bitcoin".');
  });

  it("refuses an unknown token, and a token of another chain", async () => {
    findTokenById.mockResolvedValueOnce(undefined);
    await expect(getEvmTokenAllowance(account(), "unknown", SPENDER)).rejects.toThrow(
      'No token found for id "unknown".',
    );

    findTokenById.mockResolvedValueOnce({ ...usdt, parentCurrencyId: "polygon" });
    await expect(getEvmTokenAllowance(account(), usdt.id, SPENDER)).rejects.toThrow(
      `Token "${usdt.id}" is on chain "polygon", but the account currency is "ethereum"; they must match.`,
    );
  });

  it("reads the allowance from the node of the coin module on the legacy path", async () => {
    const getTokenAllowance = jest.fn(async () => new BigNumber(42));
    jest.mocked(getNodeApi).mockReturnValue({ getTokenAllowance } as never);

    await expect(getEvmTokenAllowance(account(), usdt.id, SPENDER)).resolves.toEqual({
      allowance: new BigNumber(42),
      unit: usdt.units[0],
      symbol: "USDT",
      tokenId: usdt.id,
      owner: OWNER,
      spender: SPENDER,
      contractAddress: CONTRACT,
    });
    expect(createApi).toHaveBeenCalledWith("ethereum");
    expect(getTokenAllowance).toHaveBeenCalledWith(OWNER, CONTRACT, SPENDER);
    expect(openCurrencyPortfolio).not.toHaveBeenCalled();
  });

  describe("when the coin config of the currency enables the portfolio layer", () => {
    const call = jest.fn();

    beforeEach(() => {
      jest.mocked(isPortfolioEnabledFor).mockReturnValue(true);
      jest
        .mocked(openCurrencyPortfolio)
        .mockResolvedValue({ portfolio: { call }, network: "ethereum", mode: "local" } as never);
    });

    it("calls the token's allowance(owner, spender) through the portfolio, decoded", async () => {
      call.mockResolvedValue({
        result: ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [10n ** 30n]),
      });

      const result = await getEvmTokenAllowance(account(), usdt.id, SPENDER);

      expect(result).toMatchObject({
        allowance: new BigNumber("1000000000000000000000000000000"),
        owner: OWNER,
        spender: SPENDER,
        contractAddress: CONTRACT,
      });
      expect(isPortfolioEnabledFor).toHaveBeenCalledWith("ethereum");
      expect(openCurrencyPortfolio).toHaveBeenCalledWith(ethereum, "read");
      const owner = OWNER.slice(2).padStart(64, "0");
      const spender = SPENDER.slice(2).padStart(64, "0");
      expect(call).toHaveBeenCalledWith("ethereum", {
        params: { to: CONTRACT, data: `0xdd62ed3e${owner}${spender}` },
      });
      expect(getNodeApi).not.toHaveBeenCalled();
      expect(createApi).not.toHaveBeenCalled();
    });

    it("propagates the failure of a portfolio that makes no call", async () => {
      const unsupported = new PortfolioApiError("METHOD_NOT_ALLOWED", "call is not served");
      call.mockRejectedValue(unsupported);

      await expect(getEvmTokenAllowance(account(), usdt.id, SPENDER)).rejects.toBe(unsupported);
    });
  });
});
