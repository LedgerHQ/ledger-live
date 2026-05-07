import React from "react";
import { render, screen } from "tests/testSetup";
import ActionCard from "./index";

describe("ActionCard", () => {
  it("renders dismiss link when dismiss has a non-empty label", async () => {
    const onDismiss = jest.fn();
    const { user } = render(
      <ActionCard
        title="Title"
        description="Description"
        actions={{
          primary: { label: "Continue", action: jest.fn() },
          dismiss: {
            label: "Skip for now",
            action: onDismiss,
            dataTestId: "action-card-dismiss",
          },
        }}
      />,
    );

    const dismiss = screen.getByTestId("action-card-dismiss");
    await user.click(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not render dismiss link when dismiss is omitted", () => {
    render(
      <ActionCard
        title="Title"
        description="Description"
        actions={{
          primary: { label: "Continue", action: jest.fn() },
        }}
      />,
    );

    expect(screen.queryByTestId("action-card-dismiss")).not.toBeInTheDocument();
  });

  it("does not render dismiss link when dismiss label is empty", () => {
    render(
      <ActionCard
        title="Title"
        description="Description"
        actions={{
          primary: { label: "Continue", action: jest.fn() },
          dismiss: { label: "", action: jest.fn(), dataTestId: "action-card-dismiss" },
        }}
      />,
    );

    expect(screen.queryByTestId("action-card-dismiss")).not.toBeInTheDocument();
  });
});
