import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfoState } from "@shared/ui-info-state";
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
      ...naming
    }: {
      children: React.ReactNode;
      onEscapeKeyDown?: (event: Event) => void;
      onInteractOutside?: (event: Event) => void;
      "data-testid"?: string;
      "aria-label"?: string;
      "aria-labelledby"?: string;
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
        // Like Radix, the props the surface sets win over the link to the hidden title.
        createElement(
          "div",
          { role: "dialog", "aria-labelledby": TITLE_ID, ...naming, "data-testid": testID },
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
          { hidden, "data-testid": "dialog-header" },
          onBack
            ? createElement("button", { type: "button", "aria-label": "Go back", onClick: onBack })
            : null,
          title ? createElement("span", undefined, title) : null,
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
const CONFIRM: StakePositionHeading = { kind: "confirm", action: "withdraw" };

function renderSurface({
  heading = DETAILS,
  isOpen = true,
  isDismissible = true,
  children = <p>Step content</p>,
}: {
  heading?: StakePositionHeading;
  isOpen?: boolean;
  isDismissible?: boolean;
  children?: React.ReactNode;
} = {}) {
  const onDismiss = jest.fn();
  render(
    <StakePositionSurface
      isOpen={isOpen}
      heading={heading}
      ticker="SOL"
      currencyName="Solana"
      onDismiss={onDismiss}
      isDismissible={isDismissible}
      testID="stake-position-surface"
    >
      {children}
    </StakePositionSurface>,
    { wrapper: I18nWrapper },
  );
  return { onDismiss, user: userEvent.setup() };
}

const header = () => screen.getByTestId("dialog-header");

describe("StakePositionSurface (web)", () => {
  it("should render nothing while closed", () => {
    renderSurface({ isOpen: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should title the details after the currency in the header and show the step", () => {
    renderSurface();

    expect(screen.getByRole("dialog", { name: "Earning Solana" })).toBeVisible();
    expect(header()).toHaveTextContent("Earning Solana");
    expect(screen.getByText("Step content")).toBeVisible();
  });

  it.each<[string, StakePositionHeading, string]>([
    ["confirmation", CONFIRM, "Withdraw SOL"],
    ["success", { kind: "result", outcome: "success" }, "Transaction signed"],
    ["failure", { kind: "result", outcome: "failure" }, "Transaction failed"],
  ])("should keep the close button alone in the header of the %s", async (_step, heading, name) => {
    const { onDismiss, user } = renderSurface({ heading });

    expect(screen.getByRole("dialog", { name })).toBeVisible();
    expect(header()).not.toHaveTextContent(name);
    expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();

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

  it("should tint the dialog with the tone its step asks for", () => {
    renderSurface({
      heading: { kind: "result", outcome: "success" },
      children: <InfoState preset="success" title="Transaction signed" />,
    });

    expect(screen.getByTestId("dialog-status-gradient-success")).toBeInTheDocument();
  });

  describe("once the transaction is signed", () => {
    it("should hide the close button", () => {
      renderSurface({ heading: CONFIRM, isDismissible: false });

      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });

    it("should keep the dialog named with a hidden title", () => {
      renderSurface({ heading: DETAILS, isDismissible: false });

      expect(screen.getByRole("dialog", { name: "Earning Solana" })).toBeVisible();
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
