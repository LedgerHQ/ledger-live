import { render, screen } from "@testing-library/react";
import { FeatureToggle } from "./FeatureToggle";
import { makeStoreWrapper, FEATURE_FLAGS_DEFAULTS } from "../__tests__/renderWithStore";

describe("FeatureToggle", () => {
  it("renders children when the flag is enabled", () => {
    const { Wrapper } = makeStoreWrapper({
      resolved: { ...FEATURE_FLAGS_DEFAULTS, mockFeature: { enabled: true } },
    });
    render(
      <Wrapper>
        <FeatureToggle featureId="mockFeature" fallback={<span>off</span>}>
          <span>on</span>
        </FeatureToggle>
      </Wrapper>,
    );
    expect(screen.getByText("on")).toBeInTheDocument();
    expect(screen.queryByText("off")).not.toBeInTheDocument();
  });

  it("renders fallback when the flag is disabled", () => {
    const { Wrapper } = makeStoreWrapper();
    render(
      <Wrapper>
        <FeatureToggle featureId="mockFeature" fallback={<span>off</span>}>
          <span>on</span>
        </FeatureToggle>
      </Wrapper>,
    );
    expect(screen.getByText("off")).toBeInTheDocument();
    expect(screen.queryByText("on")).not.toBeInTheDocument();
  });

  it("renders nothing when the flag is disabled and no fallback is provided", () => {
    const { Wrapper } = makeStoreWrapper();
    const { container } = render(
      <Wrapper>
        <FeatureToggle featureId="mockFeature">
          <span>on</span>
        </FeatureToggle>
      </Wrapper>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
