import React from "react";
import { Path } from "react-native-svg";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { render, screen } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import RingChart from "../RingChart";
import DistributionCard from "../DistributionCard";

jest.mock("LLM/features/AssetDetail/hooks/useAssetDetailNavigation", () => ({
  useAssetDetailNavigation: () => ({ openFromAsset: jest.fn() }),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

const withCounterValue = (state: State): State => ({
  ...state,
  settings: { ...state.settings, counterValue: "USD" },
});

describe("Analytics RingChart (legacy)", () => {
  it("skips ring paths for a non-finite distribution but still renders the finite one", () => {
    const { UNSAFE_queryAllByType } = render(
      <RingChart
        size={76}
        strokeWidth={3}
        data={[
          { currency: bitcoin, distribution: Number.NaN, amount: 1 },
          { currency: ethereum, distribution: 0.4, amount: 4 },
        ]}
      />,
    );

    const paths = UNSAFE_queryAllByType(Path);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.every(path => !String(path.props.d).includes("NaN"))).toBe(true);
  });
});

describe("Analytics DistributionCard (legacy)", () => {
  it("renders 0% when the distribution is not finite", () => {
    render(<DistributionCard item={{ currency: bitcoin, distribution: Number.NaN, amount: 1 }} />, {
      overrideInitialState: withCounterValue,
    });

    expect(screen.getByText("0%")).toBeVisible();
  });
});
