import React from "react";
import { render, screen } from "@tests/test-renderer";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalPrompt,
} from "@ledgerhq/live-common/genericAwarenessModal";
import type { PromptViewModel } from "../../screens/useGenericAwarenessModalDrawerViewModel";
import { PromptLayout } from "../PromptLayout";

const content: GenericAwarenessModalPrompt = {
  id: "prompt",
  layout: GenericAwarenessModalLayout.Prompt,
  imageUrlLight: "https://example.com/prompt.png",
  imageUrlDark: "",
  title: "Try Ledger Wallet when you are ready",
  subtitle: "Open the feature from Ledger Wallet whenever you need it.",
  primaryButtonLabel: "Learn more",
  primaryButtonLink: "https://www.ledger.com",
  secondaryButtonLabel: "Buy your Ledger device",
  secondaryButtonLink: "ledgerlive://buy",
};

describe("PromptLayout", () => {
  const renderPromptLayout = (props?: {
    readonly onClose?: () => void;
    readonly content?: GenericAwarenessModalPrompt;
  }) => {
    const viewModel: PromptViewModel = {
      content: props?.content ?? content,
      onClosePress: jest.fn(),
      onPrimaryPress: jest.fn(),
      onMalformedUrl: jest.fn(),
    };

    return render(<PromptLayout onClose={props?.onClose ?? jest.fn()} viewModel={viewModel} />);
  };

  it("should render prompt content and the close button", () => {
    renderPromptLayout();

    expect(screen.getByText(content.title)).toBeOnTheScreen();
    expect(screen.getByText(content.subtitle)).toBeOnTheScreen();
    expect(screen.getByText("Close")).toBeOnTheScreen();
    expect(screen.getByTestId("generic-awareness-modal-secondary-button")).toBeOnTheScreen();
  });

  it.each([
    { primaryButtonLabel: "", primaryButtonLink: "https://www.ledger.com" },
    { primaryButtonLabel: "   ", primaryButtonLink: "https://www.ledger.com" },
  ] as const)("should hide the primary action button when label is empty", patch => {
    renderPromptLayout({
      content: {
        ...content,
        ...patch,
      },
    });

    expect(screen.getByText("Close")).toBeOnTheScreen();
    expect(screen.queryByTestId("generic-awareness-modal-secondary-button")).not.toBeOnTheScreen();
  });

  it.each([
    { primaryButtonLabel: "Learn more", primaryButtonLink: "" },
    { primaryButtonLabel: "Learn more", primaryButtonLink: "   " },
  ] as const)(
    "should show the primary action button when label is present and link is empty",
    patch => {
      renderPromptLayout({
        content: {
          ...content,
          ...patch,
        },
      });

      expect(screen.getByTestId("generic-awareness-modal-secondary-button")).toBeOnTheScreen();
    },
  );
});
