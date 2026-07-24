import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ArrowUp } from "@ledgerhq/lumen-ui-rnative/symbols";
import QuickActionsCtasView from "../QuickActionsCtasView";
import type { QuickActionCta } from "../../../types";

const quickActions: readonly QuickActionCta[] = [
  {
    id: "send",
    label: "Отправить",
    icon: ArrowUp,
    disabled: false,
    onPress: jest.fn(),
    testID: "quick-action-send",
  },
];

describe("QuickActionsCtasView", () => {
  it("should shrink a localized variant label to fit on one line", () => {
    render(<QuickActionsCtasView quickActions={quickActions} isVariant />);

    const label = screen.getByText("Отправить");

    expect(label).toBeVisible();
    expect(label).toHaveProp("numberOfLines", 1);
    expect(label).toHaveProp("adjustsFontSizeToFit", true);
  });
});
