import React from "react";
import { Text } from "react-native";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { QUEUED_BOTTOM_SHEET_MOCK_TEST_ID, QueuedBottomSheetMock } from "./QueuedBottomSheetMock";

afterEach(cleanup);

describe("QueuedBottomSheetMock", () => {
  it("exposes the open state requested by the consumer", () => {
    render(
      <QueuedBottomSheetMock testID="sheet" isRequestingToBeOpened>
        <Text>content</Text>
      </QueuedBottomSheetMock>,
    );

    expect(screen.getByTestId("sheet").props.accessibilityState.expanded).toBe(true);
  });

  it("reports a force-opened sheet as open too", () => {
    render(
      <QueuedBottomSheetMock testID="sheet" isForcingToBeOpened>
        <Text>content</Text>
      </QueuedBottomSheetMock>,
    );

    expect(screen.getByTestId("sheet").props.accessibilityState.expanded).toBe(true);
  });

  it("keeps the children mounted while closed, so consumers own content visibility", () => {
    render(
      <QueuedBottomSheetMock testID="sheet">
        <Text>content</Text>
      </QueuedBottomSheetMock>,
    );

    expect(screen.getByTestId("sheet").props.accessibilityState.expanded).toBe(false);
    expect(screen.getByText("content")).toBeTruthy();
  });

  it("falls back to a stable testID when the sheet passes none", () => {
    render(
      <QueuedBottomSheetMock>
        <Text>content</Text>
      </QueuedBottomSheetMock>,
    );

    expect(screen.getByTestId(QUEUED_BOTTOM_SHEET_MOCK_TEST_ID)).toBeTruthy();
  });

  it.each([
    ["dismiss", "onClose"],
    ["header-close", "onHeaderClosePressed"],
    ["backdrop", "onBackdropPress"],
    ["back", "onBack"],
  ] as const)("presses %s to call %s", (control, handlerName) => {
    const handler = jest.fn();
    render(
      <QueuedBottomSheetMock testID="sheet" isRequestingToBeOpened {...{ [handlerName]: handler }}>
        <Text>content</Text>
      </QueuedBottomSheetMock>,
    );

    fireEvent.press(screen.getByTestId(`sheet-${control}`));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("renders no control for a callback the sheet does not pass", () => {
    render(
      <QueuedBottomSheetMock testID="sheet">
        <Text>content</Text>
      </QueuedBottomSheetMock>,
    );

    expect(screen.queryByTestId("sheet-dismiss")).toBeNull();
  });

  it("does not expose dismiss while the sheet is closed", () => {
    render(
      <QueuedBottomSheetMock testID="sheet" onClose={jest.fn()}>
        <Text>content</Text>
      </QueuedBottomSheetMock>,
    );

    expect(screen.queryByTestId("sheet-dismiss")).toBeNull();
  });

  it("calls onOpened once the sheet becomes open", () => {
    const onOpened = jest.fn();
    const { rerender } = render(
      <QueuedBottomSheetMock testID="sheet" onOpened={onOpened}>
        <Text>content</Text>
      </QueuedBottomSheetMock>,
    );

    expect(onOpened).not.toHaveBeenCalled();

    rerender(
      <QueuedBottomSheetMock testID="sheet" onOpened={onOpened} isRequestingToBeOpened>
        <Text>content</Text>
      </QueuedBottomSheetMock>,
    );

    expect(onOpened).toHaveBeenCalledTimes(1);
  });
});
