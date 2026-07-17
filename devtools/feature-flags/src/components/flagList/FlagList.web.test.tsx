import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import type { PartialFeatures } from "@shared/feature-flags";
import { ALL_FLAG_IDS } from "../../constants";
import type { FeatureFlagsToolProps } from "../../types";
import { FlagList } from "./FlagList";

const { resolved } = FEATURE_FLAGS_INITIAL_STATE;

const baseProps: FeatureFlagsToolProps = {
  resolved,
  overrides: {},
  setOverride: jest.fn(),
  setAllOverrides: jest.fn(),
  clearOverride: jest.fn(),
  clearAllOverrides: jest.fn(),
};

const detailsDialog = () => screen.queryByRole("dialog");

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
    it("renders the details dialog for the flag whose row is clicked", async () => {
      const user = userEvent.setup();
      render(<FlagList {...baseProps} />);
      await user.click(screen.getByText("mockFeature"));
      expect(detailsDialog()).toBeInTheDocument();
    });

    it("closes the details dialog when it requests a close", async () => {
      const user = userEvent.setup();
      render(<FlagList {...baseProps} />);
      await user.click(screen.getByText("mockFeature"));
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(detailsDialog()).not.toBeInTheDocument();
    });

    it("clears the override of the selected flag when the details dialog restores it", async () => {
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
