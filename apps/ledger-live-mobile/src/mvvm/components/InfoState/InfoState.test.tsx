import React from "react";
import { render, screen } from "@tests/test-renderer";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Search } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from ".";
import type { InfoStatePreset } from "./types";

type VisualInfoStatePreset = Exclude<InfoStatePreset, "text">;

describe("InfoState", () => {
  it("renders title, description, banner, and actions", async () => {
    const onPrimaryPress = jest.fn();
    const onSecondaryPress = jest.fn();

    const { user } = render(
      <InfoState
        preset="success"
        title="State title"
        description="State description"
        banner={{ title: "Banner title", description: "Banner description" }}
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

    expect(screen.getByText("State title")).toBeVisible();
    expect(screen.getByText("State description")).toBeVisible();
    expect(screen.getByText("Banner title")).toBeVisible();
    expect(screen.getByText("Banner description")).toBeVisible();

    await user.press(screen.getByTestId("info-state-primary"));
    await user.press(screen.getByTestId("info-state-secondary"));

    expect(onPrimaryPress).toHaveBeenCalledTimes(1);
    expect(onSecondaryPress).toHaveBeenCalledTimes(1);
  });

  it("hides optional title, description, banner, and actions when props are omitted", () => {
    render(<InfoState preset="info" testID="info-state" />);

    expect(screen.getByTestId("info-state")).toBeVisible();
    expect(screen.queryByText("State title")).toBeNull();
    expect(screen.queryByText("State description")).toBeNull();
    expect(screen.queryByText("Banner title")).toBeNull();
    expect(screen.queryByText("Primary action")).toBeNull();
    expect(screen.queryByText("Secondary action")).toBeNull();
  });

  it.each(["success", "error", "info", "spot", "illustration"] as const)(
    "renders the %s preset visual",
    preset => {
      render(
        <InfoState
          {...getPresetProps(preset)}
          title={`${preset} title`}
          testID={`info-state-${preset}`}
        />,
      );

      expect(screen.getByTestId(`info-state-${preset}`)).toBeVisible();
      expect(screen.getByText(`${preset} title`)).toBeVisible();
    },
  );

  it("renders text preset without a preset visual gap", () => {
    render(<InfoState preset="text" title="Text-only title" testID="info-state-text" />);

    expect(screen.getByText("Text-only title")).toBeVisible();
    expect(screen.getByTestId("info-state-text")).toBeVisible();
  });
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
