import React from "react";
import { Text } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import type { StakePositionHeading } from "../../types";
import { StakePositionSurface } from "./StakePositionSurface";

type BackPressHandler = () => boolean | null | undefined;

const mockBackPressHandlers: BackPressHandler[] = [];
let mockPlatformOS: "ios" | "android" = "ios";

jest.mock("react-native", () => ({
  ...jest.requireActual("react-native"),
  Platform: {
    get OS() {
      return mockPlatformOS;
    },
    select: (specifics: Record<string, unknown>) => specifics[mockPlatformOS],
  },
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

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));

jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const sheet = jest.requireActual<typeof import("@shared/ui-queued-bottom-sheet")>(
    "@shared/ui-queued-bottom-sheet",
  );
  return { ...sheet, QueuedBottomSheet: jest.fn(sheet.QueuedBottomSheet) };
});

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const { createElement } = jest.requireActual<typeof import("react")>("react");
  const lumen = jest.requireActual<Record<string, unknown>>("@ledgerhq/lumen-ui-rnative");
  const overrides: Record<string, unknown> = {
    BottomSheetHeader: ({ title }: { title?: string }) =>
      createElement("Text", { accessibilityRole: "header" }, title),
  };
  return new Proxy(overrides, {
    get: (target, prop: string) => (prop in target ? target[prop] : lumen[prop]),
  });
});

const SHEET_TEST_ID = "stake-position-surface";
const DETAILS: StakePositionHeading = { kind: "details" };
const CONFIRM: StakePositionHeading = { kind: "confirm", action: "deactivate" };

type SheetControl = "header-close" | "backdrop" | "back";

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
      testID={SHEET_TEST_ID}
    >
      <Text>Step content</Text>
    </StakePositionSurface>,
    { wrapper: I18nWrapper },
  );
  return { onDismiss };
}

const isSheetOpen = () =>
  screen.getByTestId(SHEET_TEST_ID).props.accessibilityState.expanded === true;

const pressControl = (name: SheetControl) =>
  fireEvent.press(screen.getByTestId(`${SHEET_TEST_ID}-${name}`));

const queryControl = (name: SheetControl) => screen.queryByTestId(`${SHEET_TEST_ID}-${name}`);

const pressAndroidBack = () => {
  let isConsumed: boolean | null | undefined;
  act(() => {
    isConsumed = mockBackPressHandlers.at(-1)?.();
  });
  return isConsumed;
};

const lastSheetProps = () => jest.mocked(QueuedBottomSheet).mock.lastCall?.[0];

describe("StakePositionSurface (native)", () => {
  afterEach(() => {
    mockPlatformOS = "ios";
    jest.clearAllMocks();
  });

  it("should stay closed and leave the Android back alone while closed", () => {
    renderSurface({ isOpen: false });

    expect(isSheetOpen()).toBe(false);
    expect(mockBackPressHandlers).toHaveLength(0);
  });

  it("should show the position title and the step while open", () => {
    renderSurface();

    expect(isSheetOpen()).toBe(true);
    expect(screen.getByRole("header", { name: "SOL position" })).toBeTruthy();
    expect(screen.getByText("Step content")).toBeTruthy();
  });

  it("should show the confirmation title of the exit", () => {
    renderSurface({ heading: CONFIRM });

    expect(screen.getByRole("header", { name: "Deactivate this position?" })).toBeTruthy();
  });

  it.each(["header-close", "backdrop"] as const)("should dismiss from the %s", closeControl => {
    const { onDismiss } = renderSurface();

    pressControl(closeControl);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should go back from the header back button", () => {
    const onBack = jest.fn();
    const { onDismiss } = renderSurface({ heading: CONFIRM, onBack });

    pressControl("back");

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("should offer no close, backdrop or back control once the transaction is signed", () => {
    renderSurface({ heading: CONFIRM, isDismissible: false, onBack: jest.fn() });

    expect(queryControl("header-close")).toBeNull();
    expect(queryControl("backdrop")).toBeNull();
    expect(queryControl("back")).toBeNull();
    expect(lastSheetProps()).toMatchObject({ noCloseButton: true, preventBackdropClick: true });
  });

  describe("Android back", () => {
    it("should dismiss the details", () => {
      const { onDismiss } = renderSurface();

      expect(pressAndroidBack()).toBe(true);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("should go back from the confirmation instead of dismissing", () => {
      const onBack = jest.fn();
      const { onDismiss } = renderSurface({ heading: CONFIRM, onBack });

      expect(pressAndroidBack()).toBe(true);
      expect(onBack).toHaveBeenCalledTimes(1);
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it("should be consumed without closing once the transaction is signed", () => {
      const onBack = jest.fn();
      const { onDismiss } = renderSurface({ heading: CONFIRM, isDismissible: false, onBack });

      expect(pressAndroidBack()).toBe(true);
      expect(onBack).not.toHaveBeenCalled();
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it("should be released once the sheet is hidden behind another screen", () => {
      renderSurface();

      fireEvent.press(screen.getByTestId(`${SHEET_TEST_ID}-hidden`));

      expect(mockBackPressHandlers).toHaveLength(0);
    });
  });

  describe("height", () => {
    it("should grow up to the full height under the status bar on iOS", () => {
      renderSurface();

      expect(lastSheetProps()?.maxDynamicContentSize).toBe("fullWithOffset");
    });

    it("should grow up to the window height below the top inset on Android", () => {
      mockPlatformOS = "android";
      renderSurface();

      expect(lastSheetProps()?.maxDynamicContentSize).toBe(844 - 47);
    });
  });
});
