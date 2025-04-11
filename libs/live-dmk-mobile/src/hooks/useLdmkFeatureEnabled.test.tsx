import React from "react";
import { render } from "@testing-library/react";
import { expect } from "vitest";
import { useLdmkFeatureEnabled } from "./useLdmkFeatureEnabled";
import * as featureFlags from "@ledgerhq/live-common/featureFlags/index";

const TestComponent: React.FC = () => {
  const isEnabled = useLdmkFeatureEnabled();

  return <span data-testid="isEnabled">{String(isEnabled)}</span>;
};

describe("useLdmkFeatureEnabled", () => {
  it("returns true if feature flag enabled", async () => {
    // given
    vi.spyOn(featureFlags, "useFeature").mockReturnValue({ enabled: true });
    const { getByTestId } = render(<TestComponent />);
    // when
    const enabledStr = getByTestId("isEnabled");
    // then
    expect(enabledStr).toHaveTextContent(JSON.stringify(true));
  });
  it("returns false if feature flag disabled", async () => {
    // given
    vi.spyOn(featureFlags, "useFeature").mockReturnValue({ enabled: false });
    const { getByTestId } = render(<TestComponent />);
    // when
    const enabledStr = getByTestId("isEnabled");
    // then
    expect(enabledStr).toHaveTextContent(JSON.stringify(false));
  });
  it("returns first value if feature flag change", async () => {
    // given
    vi.spyOn(featureFlags, "useFeature").mockReturnValue({ enabled: false });
    const { rerender, getByTestId } = render(<TestComponent />);
    vi.spyOn(featureFlags, "useFeature").mockReturnValue({ enabled: true });
    // when
    rerender(<TestComponent />);
    const enabledStr = getByTestId("isEnabled");
    // then
    expect(enabledStr).toHaveTextContent(JSON.stringify(false));
  });
});
