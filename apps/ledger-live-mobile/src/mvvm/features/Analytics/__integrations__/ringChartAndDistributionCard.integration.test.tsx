import React from "react";
import { render, screen } from "@tests/test-renderer";
import { Path } from "react-native-svg";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { State } from "~/reducers/types";
import RingChart from "../components/RingChart";
import DistributionCard from "../screens/DetailedAllocation/components/DistributionCard";
import { createMockAccount, mockBitcoinCurrency, mockEthereumCurrency } from "./shared";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const mockStateWithCountervalues = (state: State): State => {
  const btcAccount = createMockAccount(mockBitcoinCurrency, "btc-1");
  return {
    ...state,
    accounts: {
      ...state.accounts,
      active: [btcAccount],
    },
    settings: {
      ...state.settings,
      counterValue: "USD",
    },
  };
};

describe("RingChart integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the chart when a single allocation fills the ring", () => {
    render(
      <RingChart
        size={76}
        strokeWidth={3}
        data={[
          {
            currency: mockBitcoinCurrency,
            distribution: 1,
            amount: 1,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("analytics-ring-chart")).toBeVisible();
  });

  it("should render the chart when multiple allocations split the ring", () => {
    render(
      <RingChart
        size={76}
        strokeWidth={3}
        data={[
          {
            currency: mockBitcoinCurrency,
            distribution: 0.6,
            amount: 6,
          },
          {
            currency: mockEthereumCurrency,
            distribution: 0.4,
            amount: 4,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("analytics-ring-chart")).toBeVisible();
  });

  it("should skip chart paths when an allocation distribution is not finite", () => {
    const { UNSAFE_queryAllByType } = render(
      <RingChart
        size={76}
        strokeWidth={3}
        data={[
          {
            currency: mockBitcoinCurrency,
            distribution: Number.NaN,
            amount: 1,
          },
          {
            currency: mockEthereumCurrency,
            distribution: 0.4,
            amount: 4,
          },
        ]}
      />,
    );

    const paths = UNSAFE_queryAllByType(Path);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.every(path => !String(path.props.d).includes("NaN"))).toBe(true);
  });
});

describe("DistributionCard integration", () => {
  const item = {
    currency: mockBitcoinCurrency,
    amount: 1_500_000,
    distribution: 0.375,
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display currency name and formatted percentage for the distribution item", () => {
    render(<DistributionCard item={item} />, {
      overrideInitialState: mockStateWithCountervalues,
    });

    expect(screen.getByText(mockBitcoinCurrency.name)).toBeVisible();
    expect(screen.getByText("37.5%")).toBeVisible();
  });

  it("should display zero percent when the distribution item is not finite", () => {
    render(<DistributionCard item={{ ...item, distribution: Number.NaN }} />, {
      overrideInitialState: mockStateWithCountervalues,
    });

    expect(screen.getByText("0%")).toBeVisible();
  });

  it("should track and navigate to the asset screen when the card is pressed", async () => {
    const { user } = render(<DistributionCard item={item} />, {
      overrideInitialState: mockStateWithCountervalues,
    });

    await user.press(screen.getByText(mockBitcoinCurrency.name));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "View Account",
      page: "Detailed Allocation",
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
      screen: ScreenName.Asset,
      params: {
        currency: mockBitcoinCurrency,
      },
    });
  });
});
