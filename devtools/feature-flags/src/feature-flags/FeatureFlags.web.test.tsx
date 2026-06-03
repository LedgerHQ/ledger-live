import { render } from "@testing-library/react";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { FeatureFlags } from "./FeatureFlags";
import type { FeatureFlagsToolProps } from "../types";

const { resolved } = FEATURE_FLAGS_INITIAL_STATE;

const baseProps: FeatureFlagsToolProps = {
  resolved,
  overrides: {},
  setOverride: jest.fn(),
  clearOverride: jest.fn(),
  clearAllOverrides: jest.fn(),
};

describe("FeatureFlags", () => {
  it("renders", () => {
    const { container } = render(<FeatureFlags {...baseProps} />);
    expect(container.firstChild).not.toBeNull();
  });
});
