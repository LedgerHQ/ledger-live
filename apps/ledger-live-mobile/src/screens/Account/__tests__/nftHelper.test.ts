import { Account, AccountLike } from "@ledgerhq/types-live";
import { isNFTCollectionsDisplayable } from "../nftHelper";

import { getEnv } from "@ledgerhq/live-env";
import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn() as jest.Mock,
}));

jest.mock("@ledgerhq/coin-framework/nft/support", () => ({
  isNFTActive: jest.fn() as jest.Mock,
}));

describe("nftHelper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isNFTCollectionsDisplayable", () => {
    it("returns false if account is empty", () => {
      const account = {
        type: "Account",
        currency: {
          id: "ethereum",
        },
      } as Account;
      const isAccountEmpty = true;
      const llmSolanaNftsEnabled = false;
      const result = isNFTCollectionsDisplayable(account, isAccountEmpty, { llmSolanaNftsEnabled });
      expect(result).toBe(false);
    });

    it("returns false if account is not an Account", () => {
      const account = {
        type: "TokenAccount",
        currency: {
          id: "ethereum",
        },
      } as unknown as AccountLike;
      const isAccountEmpty = false;
      const llmSolanaNftsEnabled = false;
      const result = isNFTCollectionsDisplayable(account, isAccountEmpty, { llmSolanaNftsEnabled });
      expect(result).toBe(false);
    });

    it("returns false if account === solana, llmNftSupportEnabled === false, and llmSolanaNftsEnabled === false", () => {
      (getEnv as jest.Mock).mockReturnValue(["solana"]);
      const account = {
        type: "Account",
        currency: {
          id: "solana",
        },
      } as Account;
      const nftCurrencies = getEnv("NFT_CURRENCIES");

      (isNFTActive as jest.Mock).mockReturnValue(nftCurrencies.includes(account.currency.id));

      const isAccountEmpty = false;
      const llmNftSupportEnabled = false;
      const llmSolanaNftsEnabled = false;
      const result = isNFTCollectionsDisplayable(account, isAccountEmpty, {
        llmNftSupportEnabled,
        llmSolanaNftsEnabled,
      });
      expect(result).toBe(false);
    });

    it("returns true if account === solana, llmNftSupportEnabled === true, and llmSolanaNftsEnabled === true", () => {
      (getEnv as jest.Mock).mockReturnValue(["solana"]);
      const account = {
        type: "Account",
        currency: {
          id: "solana",
        },
      } as Account;
      const nftCurrencies = getEnv("NFT_CURRENCIES");

      (isNFTActive as jest.Mock).mockReturnValue(nftCurrencies.includes(account.currency.id));

      const isAccountEmpty = false;
      const llmNftSupportEnabled = true;
      const llmSolanaNftsEnabled = true;
      const result = isNFTCollectionsDisplayable(account, isAccountEmpty, {
        llmNftSupportEnabled,
        llmSolanaNftsEnabled,
      });
      expect(result).toBe(true);
    });

    it("returns false if account === solana, llmNftSupportEnabled === true, and llmSolanaNftsEnabled === false", () => {
      (getEnv as jest.Mock).mockReturnValue(["solana"]);
      const account = {
        type: "Account",
        currency: {
          id: "solana",
        },
      } as Account;
      const nftCurrencies = getEnv("NFT_CURRENCIES");

      (isNFTActive as jest.Mock).mockReturnValue(nftCurrencies.includes(account.currency.id));

      const isAccountEmpty = false;
      const llmNftSupportEnabled = true;
      const llmSolanaNftsEnabled = false;
      const result = isNFTCollectionsDisplayable(account, isAccountEmpty, {
        llmNftSupportEnabled,
        llmSolanaNftsEnabled,
      });
      expect(result).toBe(false);
    });

    it("returns true if account !== solana, llmNftSupportEnabled === true, and llmSolanaNftsEnabled === false", () => {
      const account = {
        type: "Account",
        currency: {
          id: "ethereum",
        },
      } as Account;
      const isAccountEmpty = false;
      const llmNftSupportEnabled = true;
      const llmSolanaNftsEnabled = false;
      const result = isNFTCollectionsDisplayable(account, isAccountEmpty, {
        llmNftSupportEnabled,
        llmSolanaNftsEnabled,
      });
      expect(result).toBe(true);
    });

    it("returns false if llmNftSupportEnabled === false", () => {
      const account = {
        type: "Account",
        currency: {
          id: "ethereum",
        },
      } as Account;
      const isAccountEmpty = false;
      const llmNftSupportEnabled = false;
      const result = isNFTCollectionsDisplayable(account, isAccountEmpty, { llmNftSupportEnabled });
      expect(result).toBe(false);
    });

    it("returns true if llmNftSupportEnabled === true", () => {
      const account = {
        type: "Account",
        currency: {
          id: "ethereum",
        },
      } as Account;
      const isAccountEmpty = false;
      const llmNftSupportEnabled = true;
      const result = isNFTCollectionsDisplayable(account, isAccountEmpty, { llmNftSupportEnabled });
      expect(result).toBe(true);
    });
  });
});
