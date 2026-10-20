import React from "react";
import { render, screen } from "@tests/test-renderer";
import { SafeMarkdown } from ".";

describe("SafeMarkdown", () => {
  it("renders markdown text", () => {
    render(<SafeMarkdown markdown="Release notes" />);

    expect(screen.getByText("Release notes")).toBeVisible();
  });

  it("renders headings and strong text without the markdown syntax", () => {
    render(<SafeMarkdown markdown={"# Title\n\n## Section\n\nSome **bold** text"} />);

    expect(screen.getByText("Title")).toBeVisible();
    expect(screen.getByText("Section")).toBeVisible();
    expect(screen.getByText("bold")).toBeVisible();
    expect(screen.queryByText(/\*\*bold\*\*/)).toBeNull();
  });
});
