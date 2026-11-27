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

// The real header draws the close button next to an optional title.
jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const { createElement } = jest.requireActual<typeof import("react")>("react");
  const lumen = jest.requireActual<Record<string, unknown>>("@ledgerhq/lumen-ui-rnative");
  const overrides: Record<string, unknown> = {
    BottomSheetHeader: ({ title, density }: { title?: string; density?: string }) =>
      createElement(
        "Text",
        { accessibilityRole: "header", testID: `sheet-header-${density}` },
        title,
      ),
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
}: {
  heading?: StakePositionHeading;
  isOpen?: boolean;
  isDismissible?: boolean;
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

  it("should title the details after the currency in the header and show the step", () => {
    renderSurface();

    expect(isSheetOpen()).toBe(true);
    expect(screen.getByRole("header", { name: "Earning Solana" })).toBeTruthy();
    expect(screen.getByTestId("sheet-header-expanded")).toBeTruthy();
    expect(screen.getByText("Step content")).toBeTruthy();
  });

  it.each<[string, StakePositionHeading, string]>([
    ["confirmation", CONFIRM, "Deactivate your SOL"],
    ["success", { kind: "result", outcome: "success" }, "Transaction signed"],
    ["failure", { kind: "result", outcome: "failure" }, "Transaction failed"],
  ])("should keep the close button alone in the header of the %s", (_step, heading, title) => {
    const { onDismiss } = renderSurface({ heading });

    expect(screen.queryByRole("header", { name: title })).toBeNull();
    expect(screen.getByTestId("sheet-header-compact")).toBeTruthy();
    expect(queryControl("back")).toBeNull();
    expect(lastSheetProps()?.hasBackButton).toBeUndefined();

    pressControl("header-close");

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it.each(["header-close", "backdrop"] as const)("should dismiss from the %s", closeControl => {
    const { onDismiss } = renderSurface();

    pressControl(closeControl);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should offer no close or backdrop control once the transaction is signed", () => {
    renderSurface({ heading: CONFIRM, isDismissible: false });

    expect(queryControl("header-close")).toBeNull();
    expect(queryControl("backdrop")).toBeNull();
    expect(lastSheetProps()).toMatchObject({ noCloseButton: true, preventBackdropClick: true });
  });

  describe("Android back", () => {
    it.each([
      ["details", DETAILS],
      ["confirmation", CONFIRM],
    ] as const)("should dismiss the %s", (_step, heading) => {
      const { onDismiss } = renderSurface({ heading });

      expect(pressAndroidBack()).toBe(true);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("should be consumed without closing once the transaction is signed", () => {
      const { onDismiss } = renderSurface({ heading: CONFIRM, isDismissible: false });

      expect(pressAndroidBack()).toBe(true);
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it("should be released once the sheet is hidden behind another screen", () => {
      renderSurface();

      fireEvent.press(screen.getByTestId(`${SHEET_TEST_ID}-hidden`));

      expect(mockBackPressHandlers).toHaveLength(0);
    });
  });

  it("should tell the app once the sheet is hidden", () => {
    const onHidden = jest.fn();
    render(
      <StakePositionSurface
        isOpen={false}
        heading={DETAILS}
        ticker="SOL"
        onDismiss={jest.fn()}
        onHidden={onHidden}
        isDismissible
        testID={SHEET_TEST_ID}
      >
        <Text>Step content</Text>
      </StakePositionSurface>,
      { wrapper: I18nWrapper },
    );
    expect(onHidden).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId(`${SHEET_TEST_ID}-hidden`));

    expect(onHidden).toHaveBeenCalledTimes(1);
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
