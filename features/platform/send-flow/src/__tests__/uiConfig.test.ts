import { getSendUiConfig as getSendUiConfigFor, DEFAULT_SEND_UI_CONFIG } from "../uiConfig";
import { createSendFeatures } from "../descriptor/features";
import type { SendDescriptor } from "../descriptor/types";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

const mockedGetSendDescriptor = jest.fn<
  SendDescriptor | null,
  [CryptoOrTokenCurrency | undefined]
>();
const sendFeatures = createSendFeatures(mockedGetSendDescriptor);
const getSendUiConfig = (currency: CryptoOrTokenCurrency | null) =>
  getSendUiConfigFor(sendFeatures, currency);

// Test fixtures
const mockBitcoinCurrency: CryptoCurrency = {
  type: "CryptoCurrency",
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  family: "bitcoin",
} as unknown as CryptoCurrency;

const mockEthereumCurrency: CryptoCurrency = {
  type: "CryptoCurrency",
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  family: "evm",
} as unknown as CryptoCurrency;

const mockSolanaCurrency: CryptoCurrency = {
  type: "CryptoCurrency",
  id: "solana",
  name: "Solana",
  ticker: "SOL",
  family: "solana",
} as unknown as CryptoCurrency;

describe("getSendUiConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when currency is null", () => {
    it("should return default config", () => {
      const result = getSendUiConfig(null);
      expect(result).toEqual(DEFAULT_SEND_UI_CONFIG);
    });
  });

  describe("when no descriptor is available", () => {
    it("should return default config", () => {
      mockedGetSendDescriptor.mockReturnValue(null);

      const result = getSendUiConfig(mockBitcoinCurrency);
      expect(result).toEqual(DEFAULT_SEND_UI_CONFIG);
    });
  });

  describe("for Bitcoin (no memo, has fee presets)", () => {
    it("should return correct config", () => {
      mockedGetSendDescriptor.mockReturnValue({
        inputs: {},
        fees: { hasPresets: true, hasCustom: true, hasCoinControl: true },
      });

      const result = getSendUiConfig(mockBitcoinCurrency);

      expect(result).toEqual({
        hasMemo: false,
        memoType: undefined,
        memoMaxLength: undefined,
        memoMaxValue: undefined,
        memoOptions: undefined,
        recipientSupportsDomain: false,
        hasFeePresets: true,
        hasCustomFees: true,
        hasCoinControl: true,
        hasDefaultStrategy: false,
        hasBalanceTypeStep: false,
        hasFiatAmountInput: true,
      });
    });
  });

  describe("for Ethereum (supports ENS, has fee presets)", () => {
    it("should return correct config", () => {
      mockedGetSendDescriptor.mockReturnValue({
        inputs: { recipientSupportsDomain: true },
        fees: { hasPresets: true, hasCustom: true },
      });

      const result = getSendUiConfig(mockEthereumCurrency);

      expect(result).toEqual({
        hasMemo: false,
        memoType: undefined,
        memoMaxLength: undefined,
        memoMaxValue: undefined,
        memoOptions: undefined,
        recipientSupportsDomain: true,
        hasFeePresets: true,
        hasCustomFees: true,
        hasCoinControl: false,
        hasDefaultStrategy: false,
        hasBalanceTypeStep: false,
        hasFiatAmountInput: true,
      });
    });
  });

  describe("for Solana (has memo)", () => {
    it("should return correct config with memo support", () => {
      mockedGetSendDescriptor.mockReturnValue({
        inputs: {
          memo: { type: "text", maxLength: 200 },
        },
        fees: {
          hasPresets: false,
          hasCustom: true,
          defaultStrategy: { buildTransactionPatch: () => ({}) },
        },
      });

      const result = getSendUiConfig(mockSolanaCurrency);

      expect(result).toEqual({
        hasMemo: true,
        memoType: "text",
        memoMaxLength: 200,
        memoMaxValue: undefined,
        memoOptions: undefined,
        recipientSupportsDomain: false,
        hasFeePresets: false,
        hasCustomFees: true,
        hasCoinControl: false,
        hasDefaultStrategy: true,
        hasBalanceTypeStep: false,
        hasFiatAmountInput: true,
      });
    });
  });

  describe("for a testnet currency", () => {
    const mockTestnetCurrency: CryptoCurrency = {
      ...mockEthereumCurrency,
      id: "ethereum_sepolia",
      isTestnetFor: "ethereum",
    } as unknown as CryptoCurrency;

    it("should disable the fiat amount input", () => {
      mockedGetSendDescriptor.mockReturnValue({
        inputs: {},
        fees: { hasPresets: false, hasCustom: false },
      });

      expect(getSendUiConfig(mockTestnetCurrency).hasFiatAmountInput).toBe(false);
    });

    it("should disable the fiat amount input when no descriptor is available", () => {
      mockedGetSendDescriptor.mockReturnValue(null);

      expect(getSendUiConfig(mockTestnetCurrency)).toEqual({
        ...DEFAULT_SEND_UI_CONFIG,
        hasFiatAmountInput: false,
      });
    });

    it("should disable the fiat amount input for a token of a testnet", () => {
      mockedGetSendDescriptor.mockReturnValue({
        inputs: {},
        fees: { hasPresets: false, hasCustom: false },
      });
      const mockTestnetToken = {
        type: "TokenCurrency",
        id: "ethereum_sepolia/erc20/usdc",
        parentCurrencyId: "ethereum_sepolia",
      } as unknown as TokenCurrency;

      expect(getSendUiConfig(mockTestnetToken).hasFiatAmountInput).toBe(false);
    });
  });

  describe("DEFAULT_SEND_UI_CONFIG", () => {
    it("should have all features disabled and fiat input enabled by default", () => {
      expect(DEFAULT_SEND_UI_CONFIG).toEqual({
        hasMemo: false,
        memoType: undefined,
        memoMaxLength: undefined,
        memoMaxValue: undefined,
        memoOptions: undefined,
        recipientSupportsDomain: false,
        hasFeePresets: false,
        hasCustomFees: false,
        hasCoinControl: false,
        hasDefaultStrategy: false,
        hasBalanceTypeStep: false,
        hasFiatAmountInput: true,
      });
    });
  });
});
