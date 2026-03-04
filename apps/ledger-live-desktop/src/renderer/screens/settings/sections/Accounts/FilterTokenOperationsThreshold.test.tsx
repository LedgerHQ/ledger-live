import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import FilterTokenOperationsThreshold from "./FilterTokenOperationsThreshold";

jest.mock("@ledgerhq/live-common/market/state-manager/api", () => ({
  marketApi: {
    reducerPath: "marketApi",
    reducer: () => ({}),
    middleware: () => (next: (action: unknown) => unknown) => (action: unknown) => next(action),
  },
}));

const initialState = {
  settings: {
    filterTokenOperationsZeroAmount: true,
    filterTokenOperationsThreshold: 0.5,
    counterValue: "USD",
    overriddenFeatureFlags: {
      ...INITIAL_STATE.overriddenFeatureFlags,
      lldHideSmallValueTokenOperations: {
        enabled: true,
      },
    },
  },
};

describe("FilterTokenOperationsThreshold", () => {
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

  it("should show the threshold input with a 0.5 default helper", () => {
    render(<FilterTokenOperationsThreshold />, { initialState });

    expect(screen.getByTestId("input-filter-token-operations-threshold")).toHaveValue("0.5");
    expect(screen.getByText("USD")).toBeVisible();
    expect(screen.getByTestId("filter-token-operations-threshold-helper")).toHaveTextContent(
      "Hide transactions up to $0.5",
    );
  });

  it("should not persist values above 0.5", async () => {
    const { store, user } = render(<FilterTokenOperationsThreshold />, { initialState });
    const input = screen.getByTestId("input-filter-token-operations-threshold");

    await user.clear(input);
    await user.type(input, "0.7");
    expect((input as HTMLInputElement).value).toContain("0.7");

    await user.tab();

    await waitFor(() => {
      expect(store.getState().settings.filterTokenOperationsThreshold).toBe(0.5);
    });
    expect((input as HTMLInputElement).value).toBe("0.5");
    expect(screen.getByTestId("filter-token-operations-threshold-helper")).toHaveTextContent(
      "Hide transactions up to $0.5",
    );
  });
});
