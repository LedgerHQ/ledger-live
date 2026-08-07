import React from "react";
import { View } from "react-native";
import { render } from "@testing-library/react-native";
import { QueuedBottomSheet } from "./QueuedBottomSheet";
import { QueuedBottomSheetsProvider } from "../QueuedBottomSheetsProvider";

describe("QueuedBottomSheet (native)", () => {
  it("renders its children inside the bottom sheet", () => {
    const { getByTestId } = render(
      <QueuedBottomSheetsProvider>
        <QueuedBottomSheet testID="sheet" isRequestingToBeOpened>
          <View testID="sheet-content" />
        </QueuedBottomSheet>
      </QueuedBottomSheetsProvider>,
    );

    expect(getByTestId("sheet")).toBeTruthy();
    expect(getByTestId("sheet-content")).toBeTruthy();
  });
});
