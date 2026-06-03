import React from "react";
import { render, screen } from "@tests/test-renderer";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Search } from "@ledgerhq/lumen-ui-rnative/symbols";
import { BottomSheetBackgroundContext } from "LLM/contexts/BottomSheetBackgroundContext";
import { InfoState } from ".";
import type { InfoStatePreset } from "./types";

type VisualInfoStatePreset = Exclude<InfoStatePreset, "text">;

describe("InfoState", () => {
  it("GIVEN an InfoState configured with title, description, banner and CTAs WHEN it is rendered THEN it displays all of them", () => {
    // GIVEN / WHEN
    render(
      <InfoState
        preset="success"
        title="State title"
        description="State description"
        banner={{ title: "Banner title", description: "Banner description" }}
        primaryCta={{
          label: "Primary action",
          onPress: jest.fn(),
          testID: "info-state-primary",
        }}
        secondaryCta={{
          label: "Secondary action",
          onPress: jest.fn(),
          testID: "info-state-secondary",
        }}
      />,
    );

    // THEN
    expect(screen.getByText("State title")).toBeVisible();
    expect(screen.getByText("State description")).toBeVisible();
    expect(screen.getByText("Banner title")).toBeVisible();
    expect(screen.getByText("Banner description")).toBeVisible();
  });

  it("GIVEN a rendered InfoState with primary and secondary CTAs WHEN the user presses each CTA THEN the matching onPress handler is invoked", async () => {
    // GIVEN
    const onPrimaryPress = jest.fn();
    const onSecondaryPress = jest.fn();
    const { user } = render(
      <InfoState
        preset="success"
        title="State title"
        primaryCta={{
          label: "Primary action",
          onPress: onPrimaryPress,
          testID: "info-state-primary",
        }}
        secondaryCta={{
          label: "Secondary action",
          onPress: onSecondaryPress,
          testID: "info-state-secondary",
        }}
      />,
    );

    // WHEN
    await user.press(screen.getByTestId("info-state-primary"));
    await user.press(screen.getByTestId("info-state-secondary"));

    // THEN
    expect(onPrimaryPress).toHaveBeenCalledTimes(1);
    expect(onSecondaryPress).toHaveBeenCalledTimes(1);
  });

  it("GIVEN an InfoState with no optional props WHEN it is rendered THEN it does not display title, description, banner or actions", () => {
    // GIVEN / WHEN
    render(<InfoState preset="info" testID="info-state" />);

    // THEN
    expect(screen.getByTestId("info-state")).toBeVisible();
    expect(screen.queryByText("State title")).toBeNull();
    expect(screen.queryByText("State description")).toBeNull();
    expect(screen.queryByText("Banner title")).toBeNull();
    expect(screen.queryByText("Primary action")).toBeNull();
    expect(screen.queryByText("Secondary action")).toBeNull();
  });

  it.each(["success", "error", "info", "spot", "illustration"] as const)(
    "GIVEN the %s preset WHEN the InfoState is rendered THEN the preset visual and title are visible",
    preset => {
      // GIVEN / WHEN
      render(
        <InfoState
          {...getPresetProps(preset)}
          title={`${preset} title`}
          testID={`info-state-${preset}`}
        />,
      );

      // THEN
      expect(screen.getByTestId(`info-state-${preset}`)).toBeVisible();
      expect(screen.getByText(`${preset} title`)).toBeVisible();
    },
  );

  it("GIVEN the text preset WHEN the InfoState is rendered THEN the title is visible without a preset visual gap", () => {
    // GIVEN / WHEN
    render(<InfoState preset="text" title="Text-only title" testID="info-state-text" />);

    // THEN
    expect(screen.getByText("Text-only title")).toBeVisible();
    expect(screen.getByTestId("info-state-text")).toBeVisible();
  });

  it.each(["success", "error", "info"] as const)(
    "GIVEN the %s preset inside a BottomSheetBackgroundContext provider WHEN the InfoState mounts THEN it requests the matching background tone",
    preset => {
      // GIVEN
      const requestBackgroundTone = jest.fn(() => jest.fn());

      // WHEN
      render(
        <BottomSheetBackgroundContext.Provider value={{ requestBackgroundTone }}>
          <InfoState preset={preset} title={`${preset} title`} />
        </BottomSheetBackgroundContext.Provider>,
      );

      // THEN
      expect(requestBackgroundTone).toHaveBeenCalledWith(preset);
    },
  );

  it.each(["success", "error", "info"] as const)(
    "GIVEN a mounted InfoState with the %s preset WHEN it unmounts THEN its background tone registration cleanup runs",
    preset => {
      // GIVEN
      const cleanup = jest.fn();
      const requestBackgroundTone = jest.fn(() => cleanup);
      const { unmount } = render(
        <BottomSheetBackgroundContext.Provider value={{ requestBackgroundTone }}>
          <InfoState preset={preset} title={`${preset} title`} />
        </BottomSheetBackgroundContext.Provider>,
      );

      // WHEN
      unmount();

      // THEN
      expect(cleanup).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["illustration", "spot", "text"] as const)(
    "GIVEN the non-status %s preset inside a BottomSheetBackgroundContext provider WHEN the InfoState renders THEN it does not request a background tone",
    preset => {
      // GIVEN
      const requestBackgroundTone = jest.fn(() => jest.fn());

      // WHEN
      render(
        <BottomSheetBackgroundContext.Provider value={{ requestBackgroundTone }}>
          {renderInfoStateForPreset(preset)}
        </BottomSheetBackgroundContext.Provider>,
      );

      // THEN
      expect(requestBackgroundTone).not.toHaveBeenCalled();
    },
  );
});

function getPresetProps(preset: VisualInfoStatePreset): React.ComponentProps<typeof InfoState> {
  switch (preset) {
    case "illustration":
      return {
        preset,
        illustration: <Box testID="info-state-illustration-visual" />,
      };
    case "spot":
      return {
        preset,
        spotProps: { icon: Search },
      };
    case "success":
    case "error":
    case "info":
      return { preset };
    default:
      return assertNever(preset);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled info state preset: ${JSON.stringify(value)}`);
}

function renderInfoStateForPreset(preset: "illustration" | "spot" | "text") {
  switch (preset) {
    case "illustration":
      return (
        <InfoState
          preset="illustration"
          illustration={<Box testID="info-state-illustration-visual" />}
        />
      );
    case "spot":
      return <InfoState preset="spot" spotProps={{ icon: Search }} />;
    case "text":
      return <InfoState preset="text" />;
    default:
      return assertNever(preset);
  }
}
