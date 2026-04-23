import { render, screen } from "@testing-library/react";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import type { PartialFeatures } from "@shared/feature-flags";
import { DevToolsProvider, useToolProps } from ".";
import { FEATURE_FLAGS_ID } from "../toolIds";

const { resolved } = FEATURE_FLAGS_INITIAL_STATE;

const baseFeatureFlagsProps = {
  resolved,
  overrides: {} as PartialFeatures,
  setOverride: jest.fn(),
  clearOverride: jest.fn(),
  clearAllOverrides: jest.fn(),
};

const ToolPropsConsumer = ({ toolId }: { toolId: typeof FEATURE_FLAGS_ID }) => {
  const props = useToolProps(toolId);
  return <div data-testid="result">{props ? "has-props" : "no-props"}</div>;
};

describe("DevToolsProvider / useToolProps", () => {
  it("returns undefined when no provider wraps the consumer", () => {
    render(<ToolPropsConsumer toolId={FEATURE_FLAGS_ID} />);
    expect(screen.getByTestId("result")).toHaveTextContent("no-props");
  });

  it("provides tool props to consumers via context", () => {
    render(
      <DevToolsProvider {...{ [FEATURE_FLAGS_ID]: baseFeatureFlagsProps }}>
        <ToolPropsConsumer toolId={FEATURE_FLAGS_ID} />
      </DevToolsProvider>,
    );
    expect(screen.getByTestId("result")).toHaveTextContent("has-props");
  });

  it("returns undefined for a tool not registered in the provider", () => {
    render(
      <DevToolsProvider>
        <ToolPropsConsumer toolId={FEATURE_FLAGS_ID} />
      </DevToolsProvider>,
    );
    expect(screen.getByTestId("result")).toHaveTextContent("no-props");
  });
});
