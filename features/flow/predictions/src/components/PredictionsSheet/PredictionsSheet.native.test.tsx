import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
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

type BackPressHandler = () => boolean | null | undefined;

const mockBackPressHandlers: BackPressHandler[] = [];

jest.mock("react-native", () => ({
  ...jest.requireActual("react-native"),
  // The real Pressable is an accessibility element, which role queries rely on.
  Pressable: (props: object) =>
    jest.requireActual<typeof import("react")>("react").createElement("Pressable", {
      accessible: true,
      ...props,
    }),
  useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
  BackHandler: {
    addEventListener: (_event: string, handler: BackPressHandler) => {
      mockBackPressHandlers.push(handler);
      return {
        remove: () => mockBackPressHandlers.splice(mockBackPressHandlers.indexOf(handler), 1),
      };
    },
  },
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const { createElement } = jest.requireActual<typeof import("react")>("react");
  const lumen = jest.requireActual<Record<string, React.ComponentType<Record<string, unknown>>>>(
    "@ledgerhq/lumen-ui-rnative",
  );
  const overrides: Record<string, React.ComponentType<never>> = {
    BottomSheetHeader: ({ title }: { title?: string }) =>
      title === undefined ? null : createElement("Text", undefined, title),
    // The shared stub drops `disabled`, so a disabled CTA would still answer the sheet.
    Button: ({
      children,
      disabled,
      onPress,
    }: {
      children: string;
      disabled?: boolean;
      onPress: () => void;
    }) =>
      createElement(
        "Pressable",
        {
          accessible: true,
          accessibilityRole: "button",
          accessibilityState: { disabled: Boolean(disabled) },
          onPress: disabled ? undefined : onPress,
        },
        createElement("Text", undefined, children),
      ),
  };

  return new Proxy(overrides, {
    get: (target, prop: string) => (prop in target ? target[prop] : lumen[prop]),
  });
});

function renderSheet(...steps: Parameters<typeof openOnboardingSheet>) {
  render(<PredictionsSheet />, { wrapper: I18nWrapper });
  return openOnboardingSheet(...steps);
}

const isSheetOpen = () =>
  screen.getByTestId("predictions-sheet").props.accessibilityState.expanded === true;

const pressBack = () => {
  let isConsumed: boolean | null | undefined;
  act(() => {
    isConsumed = mockBackPressHandlers.at(-1)?.();
  });
  return isConsumed;
};

const button = (name: string) => screen.getByRole("button", { name });
const checkbox = (name: string) => screen.getByRole("checkbox", { name });

describe("PredictionsSheet (native)", () => {
  afterEach(() => {
    act(() => dismissPredictionsSheet());
    jest.clearAllMocks();
  });

  it("should stay closed and leave the Android back alone while no sheet is open", () => {
    render(<PredictionsSheet />, { wrapper: I18nWrapper });

    expect(isSheetOpen()).toBe(false);
    expect(mockBackPressHandlers).toHaveLength(0);
  });

  it("should walk through every step in the same sheet and complete after the last", () => {
    const { onStepAccept, onComplete, onCancel } = renderSheet(
      INTRO_STEP,
      TERMS_STEP,
      CONSENT_STEP,
    );

    expect(screen.getByTestId("predictions-intro-hero-image")).toBeTruthy();
    fireEvent.press(button(PREDICTIONS_COPY.intro.discover));

    expect(onStepAccept).toHaveBeenLastCalledWith(INTRO_STEP);
    expect(isSheetOpen()).toBe(true);
    expect(screen.queryByRole("header", { name: PREDICTIONS_COPY.intro.title })).toBeNull();
    expect(screen.getByText(PREDICTIONS_COPY.terms.title)).toBeTruthy();

    fireEvent.press(checkbox(PREDICTIONS_COPY.terms.checkbox));
    fireEvent.press(button(PREDICTIONS_COPY.terms.cta));

    expect(onStepAccept).toHaveBeenLastCalledWith(TERMS_STEP);
    expect(isSheetOpen()).toBe(true);
    expect(screen.getByRole("header", { name: PREDICTIONS_COPY.consent.title })).toBeTruthy();
    expect(checkbox(PREDICTIONS_COPY.consent.checkbox)).not.toBeChecked();
    expect(button(PREDICTIONS_COPY.consent.cta)).toBeDisabled();
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.press(checkbox(PREDICTIONS_COPY.consent.checkbox));
    fireEvent.press(button(PREDICTIONS_COPY.consent.cta));

    expect(onStepAccept).toHaveBeenLastCalledWith(CONSENT_STEP);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(isSheetOpen()).toBe(false);
  });

  describe("intro", () => {
    it("should open the learn more page and keep the intro open", () => {
      const { onStepAccept } = renderSheet(INTRO_STEP);

      fireEvent.press(button(PREDICTIONS_COPY.intro.learnMore));

      expect(openExternalMock).toHaveBeenCalledWith(PREDICTIONS_LEARN_MORE_URL);
      expect(onStepAccept).not.toHaveBeenCalled();
      expect(isSheetOpen()).toBe(true);
    });
  });

  describe("terms", () => {
    it("should accept only once the user acknowledges the disclaimer", () => {
      const { onComplete } = renderSheet(TERMS_STEP);

      expect(checkbox(PREDICTIONS_COPY.terms.checkbox)).not.toBeChecked();
      expect(button(PREDICTIONS_COPY.terms.cta)).toBeDisabled();

      fireEvent.press(checkbox(PREDICTIONS_COPY.terms.checkbox));

      expect(checkbox(PREDICTIONS_COPY.terms.checkbox)).toBeChecked();
      fireEvent.press(button(PREDICTIONS_COPY.terms.cta));

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("should let the user take the acknowledgement back", () => {
      renderSheet(TERMS_STEP);

      fireEvent.press(checkbox(PREDICTIONS_COPY.terms.checkbox));
      fireEvent.press(checkbox(PREDICTIONS_COPY.terms.checkbox));

      expect(checkbox(PREDICTIONS_COPY.terms.checkbox)).not.toBeChecked();
      expect(button(PREDICTIONS_COPY.terms.cta)).toBeDisabled();
    });

    it("should open the Terms of Use of the accepted version and keep the sheet open", () => {
      renderSheet(TERMS_STEP);

      fireEvent.press(screen.getByRole("link", { name: TERMS_OF_USE_LINK }));

      expect(openExternalMock).toHaveBeenCalledWith(TERMS_OF_USE_URLS["1"]);
      expect(isSheetOpen()).toBe(true);
    });
  });

  describe("consent", () => {
    it("should show the disclosure of the requested version", () => {
      renderSheet(CONSENT_STEP);

      expect(screen.getByText(PREDICTIONS_COPY.consent.description)).toBeTruthy();
      expect(screen.getByText(PREDICTIONS_COPY.consent.bullets.dedicatedWallet)).toBeTruthy();
      expect(screen.getByText(PREDICTIONS_COPY.consent.bullets.secureSigning)).toBeTruthy();
      expect(screen.getByText(PREDICTIONS_COPY.consent.bullets.withdraw)).toBeTruthy();
      expect(screen.getByText(PREDICTIONS_COPY.consent.footer)).toBeTruthy();
    });
  });

  it.each(["header-close", "backdrop"])(
    "should cancel and close when the user dismisses the sheet from the %s",
    closeControl => {
      const { onComplete, onCancel } = renderSheet(INTRO_STEP, TERMS_STEP);

      fireEvent.press(button(PREDICTIONS_COPY.intro.discover));
      fireEvent.press(screen.getByTestId(`predictions-sheet-${closeControl}`));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
      expect(isSheetOpen()).toBe(false);
    },
  );

  it("should cancel and close when the user presses the Android back button", () => {
    const { onComplete, onCancel } = renderSheet(CONSENT_STEP);

    expect(pressBack()).toBe(true);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
    expect(isSheetOpen()).toBe(false);
    expect(mockBackPressHandlers).toHaveLength(0);
  });

  it("should ask for the acknowledgement again when a new request replaces ticked terms", () => {
    renderSheet(TERMS_STEP);
    fireEvent.press(checkbox(PREDICTIONS_COPY.terms.checkbox));

    openOnboardingSheet(TERMS_STEP);

    expect(checkbox(PREDICTIONS_COPY.terms.checkbox)).not.toBeChecked();
    expect(button(PREDICTIONS_COPY.terms.cta)).toBeDisabled();
  });

  it("should replace the open sheet when the live app opens another one", () => {
    const { onCancel } = renderSheet(INTRO_STEP);

    openOnboardingSheet(CONSENT_STEP);

    expect(screen.getByRole("header", { name: PREDICTIONS_COPY.consent.title })).toBeTruthy();
    expect(screen.queryByRole("header", { name: PREDICTIONS_COPY.intro.title })).toBeNull();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(isSheetOpen()).toBe(true);
  });
});
