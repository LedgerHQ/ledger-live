/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import userEvent from "@testing-library/user-event";
import { Error as WalletSyncError } from "../components/Error";

describe("WalletSync Error component", () => {
  it("should render title and description", () => {
    render(<WalletSyncError title="Error title" description="Error description" />);
    expect(screen.getByText("Error title")).toBeInTheDocument();
    expect(screen.getByText("Error description")).toBeInTheDocument();
  });

  it("should render CTA button when cta and onClick provided", async () => {
    const onClick = jest.fn();
    render(<WalletSyncError title="Error" description="Desc" cta="Retry" onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Retry" });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should render close link when onClose provided", async () => {
    const onClose = jest.fn();
    render(<WalletSyncError title="Error" description="Desc" onClose={onClose} />);
    const closeLink = screen.getByText("Close");
    await userEvent.click(closeLink);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
