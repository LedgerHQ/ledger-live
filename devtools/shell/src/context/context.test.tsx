import { render, screen } from "@testing-library/react";
import { DevToolsProvider, useToolProps } from ".";
import { mockDevToolsConfig } from "../../jest/test-utils";

const TEST_TOOL_ID = "test-tool";
const testProps = { value: "hello" };

const ToolPropsConsumer = ({ toolId }: { toolId: typeof TEST_TOOL_ID }) => {
  const props = useToolProps(toolId);
  return <div data-testid="result">{props ? "has-props" : "no-props"}</div>;
};

describe("DevToolsProvider / useToolProps", () => {
  it("returns undefined when no provider wraps the consumer", () => {
    render(<ToolPropsConsumer toolId={TEST_TOOL_ID} />);
    expect(screen.getByTestId("result")).toHaveTextContent("no-props");
  });

  it("provides tool props to consumers via context", () => {
    render(
      <DevToolsProvider value={mockDevToolsConfig([{ id: TEST_TOOL_ID, config: testProps }])}>
        <ToolPropsConsumer toolId={TEST_TOOL_ID} />
      </DevToolsProvider>,
    );
    expect(screen.getByTestId("result")).toHaveTextContent("has-props");
  });

  it("returns undefined for a tool not registered in the provider", () => {
    render(
      <DevToolsProvider>
        <ToolPropsConsumer toolId={TEST_TOOL_ID} />
      </DevToolsProvider>,
    );
    expect(screen.getByTestId("result")).toHaveTextContent("no-props");
  });
});
