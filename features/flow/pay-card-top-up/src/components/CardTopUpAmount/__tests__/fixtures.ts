import type { CardTopUpAmountViewProps } from "../../../types";

/** The `payTab.cardTopUp.*` copy each app ships, mirrored for the amount view tests. */
export const CARD_TOP_UP_RESOURCES = {
  en: {
    translation: {
      payTab: {
        cardTopUp: {
          toggleInputMode: "Switch between fiat and crypto amount",
          review: "Review",
          keypadDelete: "Delete last digit",
          disclaimer:
            "Topping up sends your funds to Baanx. See <termsLink>Terms & Conditions</termsLink> and <privacyLink>Privacy Policy</privacyLink>.",
        },
      },
    },
  },
};

export function buildAmountViewProps(
  overrides: Partial<CardTopUpAmountViewProps> = {},
): CardTopUpAmountViewProps {
  return {
    title: "Top up USDC",
    headerDescription: "Bitcoin 1 · $1,000.00",
    amountText: "100",
    currencyText: "$",
    currencyPosition: "left",
    maxDecimalLength: 2,
    secondaryValue: "0.001 BTC",
    canToggleInputMode: true,
    amountError: null,
    ratios: [
      { id: "25", label: "25%", disabled: false, onSelect: jest.fn() },
      { id: "max", label: "Max", disabled: false, onSelect: jest.fn() },
    ],
    canSubmit: true,
    onAmountChange: jest.fn(),
    onToggleInputMode: jest.fn(),
    onSubmit: jest.fn(),
    onOpenLegal: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
}
