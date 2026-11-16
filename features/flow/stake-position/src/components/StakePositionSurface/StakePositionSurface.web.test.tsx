import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import type { StakePositionHeading } from "../../types";
import { StakePositionSurface } from "./StakePositionSurface";

// The shared stub renders the header's buttons only. Like the real Lumen dialog, this one closes on
// Escape and on a press outside unless the handler prevents it, and the header always renders its
// close button and registers the dialog's hidden title.
jest.mock("@ledgerhq/lumen-ui-react", () => {
  const { createContext, createElement, Fragment, useContext, useEffect } =
    jest.requireActual<typeof import("react")>("react");
  const lumen = jest.requireActual<Record<string, unknown>>("@ledgerhq/lumen-ui-react");
  const TITLE_ID = "stake-position-surface-title";
  type OpenState = { open: boolean; onOpenChange: (open: boolean) => void };
  const OpenContext = createContext<OpenState>({ open: false, onOpenChange: () => undefined });

  const closeUnlessPrevented = (
    { onOpenChange }: OpenState,
    handler: ((event: Event) => void) | undefined,
    event: Event,
  ) => {
    handler?.(event);
    if (!event.defaultPrevented) onOpenChange(false);
  };

  const overrides: Record<string, unknown> = {
    Dialog: ({ children, ...state }: OpenState & { children: React.ReactNode }) =>
      createElement(OpenContext.Provider, { value: state }, children),
    DialogContent: ({
      children,
      onEscapeKeyDown,
      onInteractOutside,
      "data-testid": testID,
    }: {
      children: React.ReactNode;
      onEscapeKeyDown?: (event: Event) => void;
      onInteractOutside?: (event: Event) => void;
      "data-testid"?: string;
    }) => {
      const state = useContext(OpenContext);
      useEffect(() => {
        if (!state.open) return;
        const onKeyDown = (event: KeyboardEvent) => {
          if (event.key === "Escape") closeUnlessPrevented(state, onEscapeKeyDown, event);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
      }, [state, onEscapeKeyDown]);
      if (!state.open) return null;
      return createElement(
        Fragment,
        undefined,
        createElement("button", {
          type: "button",
          "aria-label": "Outside the dialog",
          onClick: () =>
            closeUnlessPrevented(
              state,
              onInteractOutside,
              new CustomEvent("pointerdownoutside", { cancelable: true }),
            ),
        }),
        createElement(
          "div",
          { role: "dialog", "aria-labelledby": TITLE_ID, "data-testid": testID },
          children,
        ),
      );
    },
    DialogHeader: ({
      title,
      onBack,
      hidden,
    }: {
      title?: string;
      onBack?: () => void;
      hidden?: boolean;
    }) => {
      const { onOpenChange } = useContext(OpenContext);
      return createElement(
        Fragment,
        undefined,
        createElement(
          "div",
          { hidden },
          onBack
            ? createElement("button", { type: "button", "aria-label": "Go back", onClick: onBack })
            : null,
          createElement("span", undefined, title),
          createElement("button", {
            type: "button",
            "aria-label": "Close",
            onClick: () => onOpenChange(false),
          }),
        ),
        createElement("h2", { id: TITLE_ID, className: "sr-only" }, title),
      );
    },
  };

  return new Proxy(overrides, {
    get: (target, prop: string) => (prop in target ? target[prop] : lumen[prop]),
  });
});

const DETAILS: StakePositionHeading = { kind: "details" };

function renderSurface({
  heading = DETAILS,
  isOpen = true,
  isDismissible = true,
  onBack,
}: {
  heading?: StakePositionHeading;
  isOpen?: boolean;
  isDismissible?: boolean;
  onBack?: () => void;
} = {}) {
  const onDismiss = jest.fn();
  render(
    <StakePositionSurface
      isOpen={isOpen}
      heading={heading}
      ticker="SOL"
      onBack={onBack}
      onDismiss={onDismiss}
      isDismissible={isDismissible}
      testID="stake-position-surface"
    >
      <p>Step content</p>
    </StakePositionSurface>,
    { wrapper: I18nWrapper },
  );
  return { onDismiss, user: userEvent.setup() };
}

describe("StakePositionSurface (web)", () => {
  it("should render nothing while closed", () => {
    renderSurface({ isOpen: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should name the dialog after the position and show the step", () => {
    renderSurface();

    expect(screen.getByRole("dialog", { name: "SOL position" })).toBeVisible();
    expect(screen.getByText("Step content")).toBeVisible();
  });

  it("should name the dialog after the confirmation of the exit", () => {
    renderSurface({ heading: { kind: "confirm", action: "withdraw" } });

    expect(screen.getByRole("dialog", { name: "Withdraw all your SOL?" })).toBeVisible();
  });

  it("should dismiss from the header close button", async () => {
    const { onDismiss, user } = renderSurface();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should dismiss on Escape", async () => {
    const { onDismiss, user } = renderSurface();

    await user.keyboard("{Escape}");

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should dismiss on a press outside the dialog", async () => {
    const { onDismiss, user } = renderSurface();

    await user.click(screen.getByRole("button", { name: "Outside the dialog" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should go back from the header back button", async () => {
    const onBack = jest.fn();
    const { onDismiss, user } = renderSurface({
      heading: { kind: "confirm", action: "deactivate" },
      onBack,
    });

    await user.click(screen.getByRole("button", { name: "Go back" }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  describe("once the transaction is signed", () => {
    it("should hide the close and back buttons", () => {
      renderSurface({
        heading: { kind: "confirm", action: "deactivate" },
        isDismissible: false,
        onBack: jest.fn(),
      });

      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();
    });

    it("should keep the dialog named with a hidden title", () => {
      renderSurface({ heading: { kind: "confirm", action: "deactivate" }, isDismissible: false });

      expect(screen.getByRole("dialog", { name: "Deactivate this position?" })).toBeVisible();
    });

    it("should stay open on Escape", async () => {
      const { onDismiss, user } = renderSurface({ isDismissible: false });

      await user.keyboard("{Escape}");

      expect(onDismiss).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeVisible();
    });

    it("should stay open on a press outside the dialog", async () => {
      const { onDismiss, user } = renderSurface({ isDismissible: false });

      await user.click(screen.getByRole("button", { name: "Outside the dialog" }));

      expect(onDismiss).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeVisible();
    });
  });
});
