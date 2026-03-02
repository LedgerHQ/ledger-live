/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import userEvent from "@testing-library/user-event";
import { GenericStatusDisplay } from "../components/GenericStatusDisplay";

describe("GenericStatusDisplay", () => {
  it("should render title and description with success icon by default", () => {
    render(<GenericStatusDisplay title="Success title" description="Success description" />);
    expect(screen.getByText("Success title")).toBeInTheDocument();
    expect(screen.getByText("Success description")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should render info icon when type is info", () => {
    render(<GenericStatusDisplay title="Info" description="Info text" type="info" />);
    expect(screen.getByText("Info")).toBeInTheDocument();
  });

  it("should show close button when withClose is true and call onClose when clicked", async () => {
    const onClose = jest.fn();
    const { user } = render(
      <GenericStatusDisplay title="Done" description="All done" withClose onClose={onClose} />,
    );
    const closeButton = screen.getByRole("button", { name: "Close" });
    await user.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should show CTA button when withCta and onClick are provided", async () => {
    const onClick = jest.fn();
    render(
      <GenericStatusDisplay title="Synced" description="Sync complete" withCta onClick={onClick} />,
    );
    const ctaButton = screen.getByRole("button", {
      name: "Sync with another Ledger Wallet app",
    });
    await userEvent.click(ctaButton);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should use specificCta when provided", () => {
    render(
      <GenericStatusDisplay
        title="Title"
        description="Desc"
        withCta
        onClick={() => {}}
        specificCta="Custom CTA"
      />,
    );
    expect(screen.getByRole("button", { name: "Custom CTA" })).toBeInTheDocument();
  });

  it("should use testId when provided", () => {
    render(<GenericStatusDisplay title="Title" description="Desc" testId="custom-test-id" />);
    expect(screen.getByTestId("custom-test-id")).toHaveTextContent("Title");
  });
});
