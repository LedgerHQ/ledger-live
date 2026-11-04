import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  I18nWrapper,
  PREDICTIONS_COPY,
  TERMS_OF_USE_LINK,
  openExternalMock,
} from "../../__tests__/i18nWrapper";
import {
  CONSENT_STEP,
  INTRO_STEP,
  TERMS_STEP,
  openOnboardingSheet,
} from "../../__tests__/onboardingSheet";
import { TERMS_OF_USE_URLS } from "../../documents";
import { dismissPredictionsSheet } from "../../predictionsSheetStore.internals";
import { PREDICTIONS_LEARN_MORE_URL } from "../../urls";
import { PredictionsSheet } from "./PredictionsSheet";

jest.mock("@ledgerhq/lumen-ui-react", () => {
  const { createContext, createElement, useContext } =
    jest.requireActual<typeof import("react")>("react");
  const lumen = jest.requireActual<Record<string, React.ComponentType<Record<string, unknown>>>>(
    "@ledgerhq/lumen-ui-react",
  );
  const OnOpenChangeContext = createContext<(open: boolean) => void>(() => undefined);

  const overrides: Record<string, React.ComponentType<never>> = {
    // The header's close button is a Radix `Dialog.Close`: it reports through the dialog's
    // `onOpenChange`, which the shared stub doesn't wire.
    Dialog: ({
      open,
      onOpenChange,
      children,
    }: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      children: React.ReactNode;
    }) =>
      createElement(
        OnOpenChangeContext.Provider,
        { value: onOpenChange },
        createElement(lumen.Dialog, { open }, children),
      ),
    DialogHeader: ({ title, description }: { title?: string; description?: string }) => {
      const onOpenChange = useContext(OnOpenChangeContext);
      return createElement(
        "div",
        undefined,
        title === undefined ? null : createElement("h2", undefined, title),
        description === undefined ? null : createElement("p", undefined, description),
        createElement("button", {
          type: "button",
          "aria-label": "Close",
          onClick: () => onOpenChange(false),
        }),
      );
    },
    Checkbox: ({
      id,
      checked,
      onCheckedChange,
    }: {
      id: string;
      checked: boolean;
      onCheckedChange: (checked: boolean) => void;
    }) =>
      createElement("input", {
        type: "checkbox",
        id,
        checked,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
          onCheckedChange(event.target.checked),
      }),
  };

  return new Proxy(overrides, {
    get: (target, prop: string) => (prop in target ? target[prop] : lumen[prop]),
  });
});

function renderSheet(...steps: Parameters<typeof openOnboardingSheet>) {
  const user = userEvent.setup();
  render(<PredictionsSheet />, { wrapper: I18nWrapper });
  return { user, ...openOnboardingSheet(...steps) };
}

const queryHeading = (name: string) => screen.queryByRole("heading", { name });

// jsdom has no ResizeObserver, which the dialog uses to animate its height between steps.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("PredictionsSheet (web)", () => {
  const originalResizeObserver = global.ResizeObserver;

  beforeAll(() => {
    global.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
  });

  afterAll(() => {
    global.ResizeObserver = originalResizeObserver;
  });

  afterEach(() => {
    act(() => dismissPredictionsSheet());
    jest.clearAllMocks();
  });

  it("should render nothing while no sheet is open", () => {
    render(<PredictionsSheet />, { wrapper: I18nWrapper });

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("should walk through every step in the same dialog and complete after the last", async () => {
    const { user, onStepAccept, onComplete, onCancel } = renderSheet(
      INTRO_STEP,
      TERMS_STEP,
      CONSENT_STEP,
    );

    await user.click(screen.getByRole("button", { name: PREDICTIONS_COPY.intro.discover }));

    expect(onStepAccept).toHaveBeenLastCalledWith(INTRO_STEP);
    expect(queryHeading(PREDICTIONS_COPY.intro.title)).not.toBeInTheDocument();
    expect(queryHeading(PREDICTIONS_COPY.terms.title)).toBeVisible();

    await user.click(screen.getByLabelText(PREDICTIONS_COPY.terms.checkbox));
    await user.click(screen.getByRole("button", { name: PREDICTIONS_COPY.terms.cta }));

    expect(onStepAccept).toHaveBeenLastCalledWith(TERMS_STEP);
    expect(queryHeading(PREDICTIONS_COPY.consent.title)).toBeVisible();
    expect(screen.getByRole("button", { name: PREDICTIONS_COPY.consent.cta })).toBeDisabled();
    expect(onComplete).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText(PREDICTIONS_COPY.consent.checkbox));
    await user.click(screen.getByRole("button", { name: PREDICTIONS_COPY.consent.cta }));

    expect(onStepAccept).toHaveBeenLastCalledWith(CONSENT_STEP);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(queryHeading(PREDICTIONS_COPY.consent.title)).not.toBeInTheDocument();
  });

  it("should cancel without completing when the user closes the dialog mid-way", async () => {
    const { user, onComplete, onCancel } = renderSheet(INTRO_STEP, TERMS_STEP);

    await user.click(screen.getByRole("button", { name: PREDICTIONS_COPY.intro.discover }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
    expect(queryHeading(PREDICTIONS_COPY.terms.title)).not.toBeInTheDocument();
  });

  describe("intro", () => {
    it("should label the dialog with the intro title", () => {
      renderSheet(INTRO_STEP);

      const title = screen.getByRole("heading", { name: PREDICTIONS_COPY.intro.title });
      expect(title.closest("[aria-labelledby]")).toHaveAttribute("aria-labelledby", title.id);
    });

    it("should open the learn more page and keep the intro open", async () => {
      const { user, onStepAccept } = renderSheet(INTRO_STEP);

      await user.click(screen.getByRole("button", { name: PREDICTIONS_COPY.intro.learnMore }));

      expect(openExternalMock).toHaveBeenCalledWith(PREDICTIONS_LEARN_MORE_URL);
      expect(onStepAccept).not.toHaveBeenCalled();
      expect(queryHeading(PREDICTIONS_COPY.intro.title)).toBeVisible();
    });
  });

  describe("terms", () => {
    it("should keep the CTA disabled until the user acknowledges the disclaimer", async () => {
      const { user } = renderSheet(TERMS_STEP);

      expect(screen.getByRole("button", { name: PREDICTIONS_COPY.terms.cta })).toBeDisabled();

      await user.click(screen.getByLabelText(PREDICTIONS_COPY.terms.checkbox));

      expect(screen.getByRole("button", { name: PREDICTIONS_COPY.terms.cta })).toBeEnabled();
    });

    it("should open the Terms of Use of the accepted version and keep the sheet open", async () => {
      const { user } = renderSheet(TERMS_STEP);

      await user.click(screen.getByRole("button", { name: TERMS_OF_USE_LINK }));

      expect(openExternalMock).toHaveBeenCalledWith(TERMS_OF_USE_URLS["1"]);
      expect(queryHeading(PREDICTIONS_COPY.terms.title)).toBeVisible();
    });
  });

  describe("consent", () => {
    it("should show the disclosure of the requested version", () => {
      renderSheet(CONSENT_STEP);

      expect(queryHeading(PREDICTIONS_COPY.consent.title)).toBeVisible();
      expect(screen.getByText(PREDICTIONS_COPY.consent.description)).toBeVisible();
      expect(screen.getByText(PREDICTIONS_COPY.consent.bullets.dedicatedWallet)).toBeVisible();
      expect(screen.getByText(PREDICTIONS_COPY.consent.bullets.secureSigning)).toBeVisible();
      expect(screen.getByText(PREDICTIONS_COPY.consent.bullets.withdraw)).toBeVisible();
      expect(screen.getByText(PREDICTIONS_COPY.consent.footer)).toBeVisible();
    });
  });

  it("should ask for the acknowledgement again when a new request replaces ticked terms", async () => {
    const { user } = renderSheet(TERMS_STEP);
    await user.click(screen.getByLabelText(PREDICTIONS_COPY.terms.checkbox));

    openOnboardingSheet(TERMS_STEP);

    expect(screen.getByLabelText(PREDICTIONS_COPY.terms.checkbox)).not.toBeChecked();
    expect(screen.getByRole("button", { name: PREDICTIONS_COPY.terms.cta })).toBeDisabled();
  });

  it("should replace the open sheet when the live app opens another one", () => {
    const { onCancel } = renderSheet(INTRO_STEP);

    openOnboardingSheet(CONSENT_STEP);

    expect(queryHeading(PREDICTIONS_COPY.consent.title)).toBeVisible();
    expect(queryHeading(PREDICTIONS_COPY.intro.title)).not.toBeInTheDocument();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
