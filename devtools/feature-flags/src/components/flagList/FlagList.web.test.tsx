import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import type { PartialFeatures } from "@shared/feature-flags";
import { ALL_FLAG_IDS } from "../../constants";
import type { FeatureFlagsToolProps } from "../../types";
import { FlagList } from "./FlagList.web";

const { resolved } = FEATURE_FLAGS_INITIAL_STATE;

const baseProps: FeatureFlagsToolProps = {
  resolved,
  overrides: {},
  setOverride: jest.fn(),
  clearOverride: jest.fn(),
  clearAllOverrides: jest.fn(),
  importOverrides: jest.fn(),
};

const sidebar = () => screen.queryByTestId("feature-flags-sidebar");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("FlagList", () => {
  it("renders a row for every flag id", () => {
    render(<FlagList {...baseProps} />);
    for (const id of ALL_FLAG_IDS) {
      expect(screen.getByText(id)).toBeInTheDocument();
    }
  });

  describe("selection", () => {
    it("renders the sidebar for the flag whose row is clicked", async () => {
      const user = userEvent.setup();
      render(<FlagList {...baseProps} />);
      await user.click(screen.getByText("mockFeature"));
      expect(sidebar()).toBeInTheDocument();
    });

    it("closes the sidebar when it requests a close", async () => {
      const user = userEvent.setup();
      render(<FlagList {...baseProps} />);
      await user.click(screen.getByText("mockFeature"));
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(sidebar()).not.toBeInTheDocument();
    });

    it("clears the override of the selected flag when the sidebar restores it", async () => {
      const setOverride = jest.fn();
      const overrides: PartialFeatures = { mockFeature: { enabled: true } };
      const user = userEvent.setup();
      render(<FlagList {...baseProps} overrides={overrides} setOverride={setOverride} />);
      await user.click(screen.getByText("mockFeature"));
      await user.click(screen.getByRole("button", { name: "Restore" }));
      expect(setOverride).toHaveBeenCalledWith("mockFeature", undefined);
    });
  });
});
