import React from "react";
import { render, screen } from "tests/testSetup";
import { renderWithLinks } from "./ErrorWithAnchor";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const { openURL } = jest.requireMock("~/renderer/linking");

function Wrapper({ text }: { text: string }) {
  return <div data-testid="container">{renderWithLinks(text)}</div>;
}

describe("ErrorWithAnchor renderWithLinks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders plain text when no anchor is present", () => {
    render(<Wrapper text="no links here" />);
    expect(screen.getByTestId("container").textContent).toBe("no links here");
  });

  it("renders http(s) anchors as clickable Links and calls openURL", async () => {
    const { user } = render(
      <Wrapper text={'please read <a href="https://ledger-support.com">this</a> doc'} />,
    );
    const link = screen.getByText("this");
    await user.click(link);
    expect(openURL).toHaveBeenCalledWith("https://ledger-support.com");
  });

  it("does not open non-ledger http(s) anchors", async () => {
    const { user } = render(
      <Wrapper text={'please read <a href="https://example.com">this</a> doc'} />,
    );
    const link = screen.getByText("this");
    await user.click(link);
    expect(openURL).not.toHaveBeenCalledWith("https://example.com");
  });

  it("does not execute javascript: URLs and renders label as text", async () => {
    render(<Wrapper text={'bad <a href="javascript:alert(1)">click</a> here'} />);
    const container = screen.getByTestId("container");
    expect(container.textContent).toContain("click");
    expect(container.querySelector("a")).toBeNull();
    expect(openURL).not.toHaveBeenCalled();
  });

  it("does not execute data: URLs and renders label as text", async () => {
    render(<Wrapper text={'bad <a href="data:text/html,hi">click</a> here'} />);
    const container = screen.getByTestId("container");
    expect(container.textContent).toContain("click");
    expect(container.querySelector("a")).toBeNull();
    expect(openURL).not.toHaveBeenCalled();
  });

  it("keeps surrounding text intact when replacing anchors", () => {
    render(<Wrapper text={'prefix <a href="https://example.com">link</a> suffix'} />);
    expect(screen.getByTestId("container").textContent).toBe("prefix link suffix");
  });
});
