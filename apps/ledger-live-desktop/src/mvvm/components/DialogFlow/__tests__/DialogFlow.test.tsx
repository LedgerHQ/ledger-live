import React from "react";
import { render, screen } from "tests/testSetup";
import { DialogFlow } from "..";

type Step = "first" | "second";

function TestDialogFlow({
  currentStep,
  onBack = jest.fn(),
  onClose = jest.fn(),
}: Readonly<{
  currentStep: Step;
  onBack?: () => void;
  onClose?: () => void;
}>) {
  return (
    <DialogFlow
      currentStep={currentStep}
      defaultOptions={{
        dialogBodyProps: { className: "default-body" },
        dialogContentProps: { className: "default-content" },
        dialogHeaderProps: { density: "expanded" },
      }}
      isOpen
      onBack={onBack}
      onClose={onClose}
      screens={{
        first: {
          content: <div>First content</div>,
          options: {
            dialogHeaderProps: { title: "First title" },
          },
        },
        second: {
          content: <div>Second content</div>,
          options: {
            dialogBodyProps: { className: "second-body" },
            dialogHeaderProps: { title: "Second title" },
            hasBackButton: true,
          },
        },
      }}
    />
  );
}

describe("DialogFlow", () => {
  it("should keep the dialog mounted when the current step changes", () => {
    const { rerender } = render(<TestDialogFlow currentStep="first" />);
    const dialog = screen.getByRole("dialog");

    rerender(<TestDialogFlow currentStep="second" />);

    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(screen.getByText("Second content")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Second title" })).toBeVisible();
  });

  it("should let screen options override default options", () => {
    render(<TestDialogFlow currentStep="second" />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("default-content");
    expect(screen.getByText("Second content").parentElement).toHaveClass("second-body");
    expect(screen.getByText("Second content").parentElement).not.toHaveClass("default-body");
  });

  it("should expose back and close actions for the current screen", async () => {
    const onBack = jest.fn();
    const onClose = jest.fn();
    const { user } = render(
      <TestDialogFlow currentStep="second" onBack={onBack} onClose={onClose} />,
    );

    await user.click(screen.getByLabelText("components.dialogHeader.goBackAriaLabel"));
    await user.click(screen.getByLabelText("components.dialogHeader.closeAriaLabel"));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
