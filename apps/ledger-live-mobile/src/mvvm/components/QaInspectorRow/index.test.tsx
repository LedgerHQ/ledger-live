import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react-native";
import StyleProvider from "~/StyleProvider";
import settings from "~/reducers/settings";
import { QaInspectorRow, type QaInspectorField } from ".";

function renderRow(field: QaInspectorField) {
  const store = configureStore({ reducer: { settings } });

  return render(
    <Provider store={store}>
      <StyleProvider selectedPalette="dark">
        <QaInspectorRow field={field} />
      </StyleProvider>
    </Provider>,
  );
}

describe("QaInspectorRow", () => {
  it("should show the label, value, status and raw line", () => {
    renderRow({
      label: "OS notification permission",
      value: "Not determined",
      raw: "permissionStatus: -1",
      status: { label: "Off", tone: "gray" },
    });

    expect(screen.getByText("OS notification permission")).toBeVisible();
    expect(screen.getByText("Not determined")).toBeVisible();
    expect(screen.getByText("permissionStatus: -1")).toBeVisible();
    expect(screen.getByText("Off")).toBeVisible();
  });

  it("should omit the raw line when the field has no raw value", () => {
    renderRow({
      label: "Drawer target",
      value: "globalPushNotifications",
      status: { label: "Resolved", tone: "success" },
    });

    expect(screen.getByText("globalPushNotifications")).toBeVisible();
    expect(screen.queryByText(/permissionStatus/)).toBeNull();
  });
});
