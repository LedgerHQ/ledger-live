import React from "react";
import { render } from "@tests/test-renderer";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { Footer } from "../Footer";

const solana = getCryptoCurrencyById("solana");

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
}));

jest.mock("~/hooks/useQuickActions", () => ({
  __esModule: true,
  default: () => ({
    quickActionsList: {
      BUY: {
        icon: () => null,
        route: ["Buy"],
        disabled: false,
        testID: "button-buy",
      },
      SWAP: {
        icon: () => null,
        route: ["Swap"],
        disabled: false,
        testID: "button-swap",
      },
      SELL: {
        icon: () => null,
        route: ["Sell"],
        disabled: false,
        testID: "button-sell",
      },
    },
  }),
}));

describe("Footer", () => {
  const mockNavigate = jest.fn();
  const mockRoute = { name: "Portfolio" };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate });
    (useRoute as jest.Mock).mockReturnValue(mockRoute);
  });

  it("renders all available quick actions", () => {
    const { getByTestId } = render(<Footer currency={solana} />);
    expect(getByTestId("button-buy")).toBeTruthy();
    expect(getByTestId("button-swap")).toBeTruthy();
    expect(getByTestId("button-sell")).toBeTruthy();
  });

  it("calls track and navigate when a quick action is pressed", async () => {
    const { getByTestId, user } = render(<Footer currency={solana} />);
    await user.press(getByTestId("button-buy"));

    expect(mockNavigate).toHaveBeenCalledWith("Buy");
  });
});
