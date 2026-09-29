import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import SafeMarkdown, { MarkdownRenderBoundary } from "./SafeMarkdown";
import { getFontStyle } from "./LText";

function BrokenMarkdown(): never {
  throw new Error("parse failed");
}

type StyledNode = {
  props?: { style?: unknown };
  parent?: StyledNode | null;
};

function collectStyles(node: StyledNode | null | undefined): object[] {
  const styles: object[] = [];
  let current = node ?? null;
  while (current) {
    const style = current.props?.style;
    for (const item of Array.isArray(style) ? style : [style]) {
      if (item && typeof item === "object") {
        styles.push(item);
      }
    }
    current = current.parent ?? null;
  }
  return styles;
}

describe("SafeMarkdown", () => {
  it("should render markdown text", () => {
    render(<SafeMarkdown markdown="Release notes" />);
    expect(screen.getByText("Release notes")).toBeVisible();
  });

  it("should render strong markdown", () => {
    render(<SafeMarkdown markdown="**Important** update" />);
    expect(screen.queryByText("**Important** update")).toBeNull();
    const important = screen.getByText("Important");
    expect(important).toBeVisible();
    expect(collectStyles(important)).toContainEqual(
      expect.objectContaining(getFontStyle({ semiBold: true })),
    );
    expect(screen.getByText(/update/)).toBeVisible();
  });

  it("should fall back to plain text when the markdown renderer throws", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <MarkdownRenderBoundary markdown="raw notes">
        <BrokenMarkdown />
      </MarkdownRenderBoundary>,
    );

    expect(screen.getByText("raw notes")).toBeVisible();
    consoleError.mockRestore();
  });
});
