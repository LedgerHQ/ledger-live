import React from "react";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { MoreIcon, MoreListItem } from "./MoreRowParts";
import type { MoreRowId } from "../types";

function iconOf(rowId: MoreRowId) {
  return (MoreIcon({ rowId }) as React.ReactElement<{ icon: unknown }>).props.icon;
}

describe("MoreRowParts (native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("calls the row handler when the list item is pressed", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    render(
      <MoreListItem rowId="logout" onPress={onPress}>
        <MoreIcon rowId="logout" />
      </MoreListItem>,
    );

    await user.press(screen.getByTestId("more-row-logout"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("gives each row its own icon", () => {
    const icons = (["managePin", "accessBaanx", "help", "logout"] as const).map(iconOf);

    expect(new Set(icons).size).toBe(4);
  });
});
