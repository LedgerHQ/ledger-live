import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Asterisk, ExitLogout, Question, Settings } from "@ledgerhq/lumen-ui-react/symbols";
import { CardMoreIcon, CardMoreListItem } from "../CardMoreRowParts.web";

type SpotIcon = typeof Asterisk;

function iconOf(rowId: React.ComponentProps<typeof CardMoreIcon>["rowId"]): SpotIcon {
  return (CardMoreIcon({ rowId }) as React.ReactElement<{ icon: SpotIcon }>).props.icon;
}

describe("CardMoreRowParts (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("calls the row handler when the list item is clicked", () => {
    const onPress = jest.fn();
    render(
      <CardMoreListItem rowId="logout" onPress={onPress}>
        <CardMoreIcon rowId="logout" />
      </CardMoreListItem>,
    );

    fireEvent.click(screen.getByTestId("card-more-row-logout"));

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
