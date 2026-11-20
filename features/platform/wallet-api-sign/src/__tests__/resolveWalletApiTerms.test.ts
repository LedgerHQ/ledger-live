import { resolveWalletApiTerms } from "../resolveWalletApiTerms";
import type { WalletApiTermsSources } from "../types";

const ONEINCH_ROUTER = "0x111111125421ca6dc452d289314280a0f8842a65";
const UNISWAP_ROUTER = "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af";

const sources: WalletApiTermsSources = {
  dexProvidersContractAddress: {
    [ONEINCH_ROUTER.toLowerCase()]: "1inch",
    [UNISWAP_ROUTER.toLowerCase()]: "Uniswap",
  },
  termsOfUse: {
    "1inch": "https://1inch.example/tos",
    Uniswap: "https://uniswap.example/tos",
    paraswap: "https://paraswap.example/tos",
  },
  privacyPolicy: {
    Uniswap: "https://uniswap.example/privacy",
  },
};

describe("resolveWalletApiTerms", () => {
  it("resolves terms without a privacy policy for a matching DEX router", () => {
    expect(
      resolveWalletApiTerms({
        manifestId: "swap-live-app",
        manifestName: "Swap",
        recipient: ONEINCH_ROUTER,
        sources,
      }),
    ).toEqual({
      appName: "1inch",
      termsOfUseUrl: "https://1inch.example/tos",
      privacyUrl: undefined,
    });
  });

  it("resolves both terms and privacy policy case-insensitively from the recipient", () => {
    expect(
      resolveWalletApiTerms({
        manifestId: "swap-live-app",
        manifestName: "Swap",
        recipient: UNISWAP_ROUTER,
        sources,
      }),
    ).toEqual({
      appName: "Uniswap",
      termsOfUseUrl: "https://uniswap.example/tos",
      privacyUrl: "https://uniswap.example/privacy",
    });
  });

  it("falls back to the manifestId and displays the manifestName when the recipient is unknown", () => {
    expect(
      resolveWalletApiTerms({
        manifestId: "paraswap",
        manifestName: "ParaSwap",
        sources,
      }),
    ).toEqual({
      appName: "ParaSwap",
      termsOfUseUrl: "https://paraswap.example/tos",
      privacyUrl: undefined,
    });
  });

  it("ignores Object.prototype keys in the recipient and the manifestId", () => {
    expect(
      resolveWalletApiTerms({
        manifestId: "paraswap",
        manifestName: "ParaSwap",
        recipient: "constructor",
        sources,
      }),
    ).toEqual({
      appName: "ParaSwap",
      termsOfUseUrl: "https://paraswap.example/tos",
      privacyUrl: undefined,
    });
    expect(resolveWalletApiTerms({ manifestId: "constructor", sources })).toBeNull();
  });

  it("returns null when the manifestId is empty or no terms exist", () => {
    expect(resolveWalletApiTerms({ manifestId: "", sources })).toBeNull();
    expect(
      resolveWalletApiTerms({
        manifestId: "swap-live-app",
        manifestName: "Swap",
        sources,
      }),
    ).toBeNull();
  });
});
