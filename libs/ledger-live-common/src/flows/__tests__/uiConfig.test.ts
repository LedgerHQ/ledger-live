import { getSendUiConfig, DEFAULT_SEND_UI_CONFIG } from "../send/uiConfig";
import { getSendDescriptor, sendFeatures } from "../../bridge/descriptor";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

// Mock the bridge descriptor module
jest.mock("../../bridge/descriptor", () => ({
  getSendDescriptor: jest.fn(),
  sendFeatures: {
    hasMemo: jest.fn(),
    getMemoMaxLength: jest.fn(),
    getMemoMaxValue: jest.fn(),
    getMemoOptions: jest.fn(),
    supportsDomain: jest.fn(),
    hasFeePresets: jest.fn(),
    hasCustomFees: jest.fn(),
    hasCoinControl: jest.fn(),
  },
}));

const mockedGetSendDescriptor = getSendDescriptor as jest.MockedFunction<typeof getSendDescriptor>;
const mockedSendFeatures = sendFeatures as jest.Mocked<typeof sendFeatures>;

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
      mockedSendFeatures.hasMemo.mockReturnValue(false);
      mockedSendFeatures.getMemoMaxLength.mockReturnValue(undefined);
      mockedSendFeatures.getMemoMaxValue.mockReturnValue(undefined);
      mockedSendFeatures.getMemoOptions.mockReturnValue(undefined);
      mockedSendFeatures.supportsDomain.mockReturnValue(false);
      mockedSendFeatures.hasFeePresets.mockReturnValue(true);
      mockedSendFeatures.hasCustomFees.mockReturnValue(true);
      mockedSendFeatures.hasCoinControl.mockReturnValue(true);

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
      });
    });
  });

  describe("for Ethereum (supports ENS, has fee presets)", () => {
    it("should return correct config", () => {
      mockedGetSendDescriptor.mockReturnValue({
        inputs: { recipientSupportsDomain: true },
        fees: { hasPresets: true, hasCustom: true },
      });
      mockedSendFeatures.hasMemo.mockReturnValue(false);
      mockedSendFeatures.getMemoMaxLength.mockReturnValue(undefined);
      mockedSendFeatures.getMemoMaxValue.mockReturnValue(undefined);
      mockedSendFeatures.getMemoOptions.mockReturnValue(undefined);
      mockedSendFeatures.supportsDomain.mockReturnValue(true);
      mockedSendFeatures.hasFeePresets.mockReturnValue(true);
      mockedSendFeatures.hasCustomFees.mockReturnValue(true);
      mockedSendFeatures.hasCoinControl.mockReturnValue(false);

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
      });
    });
  });

  describe("for Solana (has memo)", () => {
    it("should return correct config with memo support", () => {
      mockedGetSendDescriptor.mockReturnValue({
        inputs: {
          memo: { type: "text", maxLength: 200 },
        },
        fees: { hasPresets: false, hasCustom: true },
      });
      mockedSendFeatures.hasMemo.mockReturnValue(true);
      mockedSendFeatures.getMemoMaxLength.mockReturnValue(200);
      mockedSendFeatures.getMemoMaxValue.mockReturnValue(undefined);
      mockedSendFeatures.getMemoOptions.mockReturnValue(undefined);
      mockedSendFeatures.supportsDomain.mockReturnValue(false);
      mockedSendFeatures.hasFeePresets.mockReturnValue(false);
      mockedSendFeatures.hasCustomFees.mockReturnValue(true);
      mockedSendFeatures.hasCoinControl.mockReturnValue(false);

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
      });
    });
  });

  describe("DEFAULT_SEND_UI_CONFIG", () => {
    it("should have all features disabled by default", () => {
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
      });
    });
  });
});
