import { render, screen } from "@testing-library/react";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
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
};

describe("FlagList", () => {
  it("renders a row for every flag id", () => {
    render(<FlagList {...baseProps} />);
    for (const id of ALL_FLAG_IDS) {
      expect(screen.getByText(id)).toBeInTheDocument();
    }
  });
});
