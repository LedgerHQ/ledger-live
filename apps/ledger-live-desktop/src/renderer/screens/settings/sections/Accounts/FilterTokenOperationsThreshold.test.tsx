import React from "react";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import {
  calculate,
  initialState as countervaluesInitialState,
} from "@ledgerhq/live-countervalues/logic";
import { render, screen, waitFor } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import FilterTokenOperationsThreshold from "./FilterTokenOperationsThreshold";

jest.mock("@ledgerhq/live-common/market/state-manager/api", () => ({
  marketApi: {
    reducerPath: "marketApi",
    reducer: (state = {}) => state,
    middleware: () => (next: (action: unknown) => unknown) => (action: unknown) => next(action),
  },
}));
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCountervaluesState: jest.fn(),
}));
jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues/logic"),
  calculate: jest.fn(),
}));

const mockUseCountervaluesState = jest.mocked(useCountervaluesState);
const mockCalculate = jest.mocked(calculate);

const rateByTicker: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  JPY: 145.6,
};

const convertCountervalueMinorUnit = ({
  value,
  from,
  to,
  reverse,
}: {
  value: number;
  from: { ticker: string; units: Array<{ magnitude: number }> };
  to: { ticker: string; units: Array<{ magnitude: number }> };
  reverse?: boolean;
}) => {
  if (reverse) {
    const toMajorValue = value / Math.pow(10, to.units[0].magnitude);
    const usdMajorValue = toMajorValue / rateByTicker[to.ticker];
    const fromMajorValue = usdMajorValue * rateByTicker[from.ticker];

    return fromMajorValue * Math.pow(10, from.units[0].magnitude);
  }

  const fromMajorValue = value / Math.pow(10, from.units[0].magnitude);
  const usdMajorValue = fromMajorValue / rateByTicker[from.ticker];
  const toMajorValue = usdMajorValue * rateByTicker[to.ticker];

  return toMajorValue * Math.pow(10, to.units[0].magnitude);
};

const initialState = {
  settings: {
    filterTokenOperationsZeroAmount: true,
    filterTokenOperationsThreshold: 0.5,
    counterValue: "EUR",
    overriddenFeatureFlags: {
      ...INITIAL_STATE.overriddenFeatureFlags,
      lldHideSmallValueTokenOperations: {
        enabled: true,
      },
    },
  },
};

describe("FilterTokenOperationsThreshold", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCountervaluesState.mockReturnValue(countervaluesInitialState);
    mockCalculate.mockImplementation((_state, query) => convertCountervalueMinorUnit(query));
  });

  it("should not render the input when the feature flag is off", () => {
    render(<FilterTokenOperationsThreshold />, {
      initialState: {
        settings: {
          ...initialState.settings,
          overriddenFeatureFlags: {
            ...INITIAL_STATE.overriddenFeatureFlags,
            lldHideSmallValueTokenOperations: {
              enabled: false,
            },
          },
        },
      },
    });

    expect(screen.queryByTestId("input-filter-token-operations-threshold")).not.toBeInTheDocument();
  });

  it("should not render the input when the toggle is off", () => {
    render(<FilterTokenOperationsThreshold />, {
      initialState: {
        settings: {
          ...initialState.settings,
          filterTokenOperationsZeroAmount: false,
        },
      },
    });

    expect(screen.queryByTestId("input-filter-token-operations-threshold")).not.toBeInTheDocument();
  });

  it("should show the converted threshold in the selected countervalue", () => {
    render(<FilterTokenOperationsThreshold />, { initialState });

    expect(screen.getByTestId("input-filter-token-operations-threshold")).toHaveValue("0.46");
    expect(screen.getAllByText("EUR")[0]).toBeVisible();
    expect(screen.getByTestId("filter-token-operations-threshold-helper")).toHaveTextContent(
      "Hide transactions up to 0.46 EUR",
    );
  });

  it("should update the displayed threshold when the countervalue changes", async () => {
    const { store, user } = render(<FilterTokenOperationsThreshold />, { initialState });
    const input = screen.getByTestId("input-filter-token-operations-threshold");

    await user.clear(input);
    await user.type(input, "0.4");
    expect(input).toHaveValue("0.4");

    store.dispatch({
      type: "SAVE_SETTINGS",
      payload: {
        counterValue: "USD",
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("input-filter-token-operations-threshold")).toHaveValue("0.5");
    });
    expect(screen.getByTestId("filter-token-operations-threshold-helper")).toHaveTextContent(
      "Hide transactions up to 0.50 USD",
    );
  });

  it("should convert the edited value back to canonical USD", async () => {
    const { store, user } = render(<FilterTokenOperationsThreshold />, { initialState });
    const input = screen.getByTestId("input-filter-token-operations-threshold");

    await user.clear(input);
    await user.type(input, "0.37");
    await user.tab();

    await waitFor(() => {
      expect(store.getState().settings.filterTokenOperationsThreshold).toBeCloseTo(
        0.40217391304347827,
        8,
      );
    });
    expect(screen.getByTestId("input-filter-token-operations-threshold")).toHaveValue("0.37");
    expect(screen.getByTestId("filter-token-operations-threshold-helper")).toHaveTextContent(
      "Hide transactions up to 0.37 EUR",
    );
  });

  it("should floor the displayed threshold to the selected currency magnitude", () => {
    render(<FilterTokenOperationsThreshold />, {
      initialState: {
        settings: {
          ...initialState.settings,
          counterValue: "JPY",
        },
      },
    });

    expect(screen.getByTestId("input-filter-token-operations-threshold")).toHaveValue("72");
    expect(screen.getByTestId("filter-token-operations-threshold-helper")).toHaveTextContent(
      "Hide transactions up to 72 JPY",
    );
  });

  it("should not persist local values above the canonical USD max", async () => {
    const { store, user } = render(<FilterTokenOperationsThreshold />, { initialState });
    const input = screen.getByTestId("input-filter-token-operations-threshold");

    await user.clear(input);
    await user.type(input, "0.5");
    expect((input as HTMLInputElement).value).toContain("0.5");

    await user.tab();

    await waitFor(() => {
      expect(store.getState().settings.filterTokenOperationsThreshold).toBe(0.5);
    });
    expect((input as HTMLInputElement).value).toBe("0.46");
    expect(screen.getByTestId("filter-token-operations-threshold-helper")).toHaveTextContent(
      "Hide transactions up to 0.46 EUR",
    );
  });

  it("should keep the draft value on blur when USD conversion is unavailable", async () => {
    const { user } = render(<FilterTokenOperationsThreshold />, { initialState });
    const input = screen.getByTestId("input-filter-token-operations-threshold");

    await user.clear(input);
    await user.type(input, "0.41");

    mockCalculate.mockReturnValue(undefined);

    await user.tab();

    expect(screen.getByTestId("input-filter-token-operations-threshold")).toHaveValue("0.41");
  });
});
