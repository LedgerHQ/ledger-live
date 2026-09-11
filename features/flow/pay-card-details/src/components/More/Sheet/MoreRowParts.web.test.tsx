import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Asterisk, ExitLogout, Question, Settings } from "@ledgerhq/lumen-ui-react/symbols";
import { MoreIcon, MoreListItem } from "./MoreRowParts";

type SpotIcon = typeof Asterisk;

function iconOf(rowId: React.ComponentProps<typeof MoreIcon>["rowId"]): SpotIcon {
  return (MoreIcon({ rowId }) as React.ReactElement<{ icon: SpotIcon }>).props.icon;
}

describe("MoreRowParts (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("calls the row handler when the list item is clicked", () => {
    const onPress = jest.fn();
    render(
      <MoreListItem rowId="logout" onPress={onPress}>
        <MoreIcon rowId="logout" />
      </MoreListItem>,
    );

    fireEvent.click(screen.getByTestId("more-row-logout"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["managePin", Asterisk],
    ["accessBaanx", Settings],
    ["help", Question],
    ["logout", ExitLogout],
  ] as const)("gives the %s row its own icon", (rowId, expected) => {
    expect(iconOf(rowId)).toBe(expected);
  });
});
