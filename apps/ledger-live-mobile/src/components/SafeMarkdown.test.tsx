import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import SafeMarkdown, { MarkdownRenderBoundary } from "./SafeMarkdown";

function BrokenMarkdown(): never {
  throw new Error("parse failed");
}

describe("SafeMarkdown", () => {
  it("should render markdown text", () => {
    render(<SafeMarkdown markdown="Release notes" />);
    expect(screen.getByText("Release notes")).toBeVisible();
  });

  it("should render strong markdown", () => {
    render(<SafeMarkdown markdown="**Important** update" />);
    expect(screen.getByText("Important")).toBeVisible();
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
