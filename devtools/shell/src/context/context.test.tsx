import { render, screen } from "@testing-library/react";
import { parse } from "@devtools/core";
import { DevToolsProvider, useToolProps } from ".";

const TEST_TOOL_ID = parse("test-tool");
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
      <DevToolsProvider value={{ [TEST_TOOL_ID]: testProps }}>
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
