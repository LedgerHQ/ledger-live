import React from "react";
import { render, screen } from "@tests/test-renderer";
import { QaInspectorRow, type QaInspectorField } from ".";

function renderRow(field: QaInspectorField) {
  return render(<QaInspectorRow field={field} />);
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
