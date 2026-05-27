import { render, screen } from "@testing-library/react";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import type { PartialFeatures } from "@shared/feature-flags";
import { FeatureFlags } from "./FeatureFlags";
import type { FeatureFlagsToolProps } from "./types";

const { resolved } = FEATURE_FLAGS_INITIAL_STATE;

const baseProps: FeatureFlagsToolProps = {
  resolved,
  overrides: {},
  setOverride: jest.fn(),
  clearOverride: jest.fn(),
  clearAllOverrides: jest.fn(),
};

describe("FeatureFlags", () => {
  it("renders the heading", () => {
    render(<FeatureFlags {...baseProps} />);
    expect(screen.getByRole("heading", { name: "Feature Flags props" })).toBeTruthy();
  });

  it("shows zero overrides and the resolved-flag count when no overrides are set", () => {
    render(<FeatureFlags {...baseProps} />);
    expect(screen.getByText("Overrides: 0")).toBeTruthy();
    expect(screen.getByText(`Resolved: ${Object.keys(resolved).length}`)).toBeTruthy();
  });

  it("counts a single override and renders it as JSON", () => {
    const overrides: PartialFeatures = { mockFeature: { enabled: true } };
    render(<FeatureFlags {...baseProps} overrides={overrides} />);
    expect(screen.getByText("Overrides: 1")).toBeTruthy();
    const json = screen.getByText((_, node) => node?.tagName === "PRE");
    expect(json.textContent).toContain("mockFeature");
  });
});
