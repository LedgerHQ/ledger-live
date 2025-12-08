import React from "react";
import { render, screen } from "tests/testSetup";
import { ErrorWithAnchorContent } from "./ErrorWithAnchor";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const { openURL } = jest.requireMock("~/renderer/linking");

describe("ErrorWithAnchor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders plain text when no anchor is present", () => {
    render(<ErrorWithAnchorContent html="no links here" />);
    expect(screen.getByText("no links here")).toBeVisible();
  });

  it("renders http(s) anchors as clickable Links and calls openURL", async () => {
    const { user } = render(
      <ErrorWithAnchorContent
        html={'please read <a href="https://support.ledger.com/">this</a> doc'}
      />,
    );
    const link = screen.getByText("this");
    await user.click(link);
    expect(openURL).toHaveBeenCalledWith("https://support.ledger.com/");
  });

  it("does not open non-ledger http(s) anchors", async () => {
    const { user } = render(
      <ErrorWithAnchorContent html={'please read <a href="https://example.com">this</a> doc'} />,
    );
    const link = screen.getByText("this");
    await user.click(link);
    expect(openURL).not.toHaveBeenCalledWith("https://example.com");
  });

  it("does not execute javascript: URLs and renders label as text", async () => {
    const { container } = render(
      <ErrorWithAnchorContent html={'bad <a href="javascript:alert(1)">click</a> here'} />,
    );
    expect(container.textContent).toContain("click");
    expect(container.querySelector("a")).toBeNull();
    expect(openURL).not.toHaveBeenCalled();
  });

  it("does not execute data: URLs and renders label as text", async () => {
    const { container } = render(
      <ErrorWithAnchorContent html={'bad <a href="data:text/html,hi">click</a> here'} />,
    );
    expect(container.textContent).toContain("click");
    expect(container.querySelector("a")).toBeNull();
    expect(openURL).not.toHaveBeenCalled();
  });

  it("keeps surrounding text intact when replacing anchors", () => {
    const { container } = render(
      <ErrorWithAnchorContent html={'prefix <a href="https://example.com">link</a> suffix'} />,
    );
    expect(container.textContent).toBe("prefix link suffix");
  });
});
