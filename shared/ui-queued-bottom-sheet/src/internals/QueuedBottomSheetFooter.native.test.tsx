import React from "react";
import { View } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { QueuedBottomSheetFooter } from "./QueuedBottomSheetFooter.native";

describe("QueuedBottomSheetFooter (native)", () => {
  it("reports its measured height so the sheet content can reserve room for it", () => {
    const onHeightChange = jest.fn();

    render(
      <QueuedBottomSheetFooter onHeightChange={onHeightChange}>
        <View testID="footer-action" />
      </QueuedBottomSheetFooter>,
    );

    const [measuredView] = screen.UNSAFE_getAllByType(View);
    fireEvent(measuredView, "layout", { nativeEvent: { layout: { height: 96 } } });

    expect(onHeightChange).toHaveBeenCalledWith(96);
  });
});
