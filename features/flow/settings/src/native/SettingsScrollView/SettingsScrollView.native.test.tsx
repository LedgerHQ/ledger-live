import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { SettingsScrollView } from "./SettingsScrollView";

const BOTTOM_INSET = 34;
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: BOTTOM_INSET, left: 0, right: 0 }),
}));

describe("SettingsScrollView", () => {
  it("pads the end of the content by the bottom safe area", () => {
    render(
      <SettingsScrollView testID="settings-scroll">
        <Text>Row</Text>
      </SettingsScrollView>,
    );

    expect(screen.getByText("Row")).toBeVisible();
    expect(screen.getByTestId("settings-scroll").props.contentContainerStyle).toEqual({
      paddingBottom: BOTTOM_INSET,
    });
  });
});
