import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { Asterisk, ExitLogout, Question, Settings } from "@ledgerhq/lumen-ui-rnative/symbols";
import { CardMoreIcon, CardMoreListItem } from "../CardMoreRowParts.native";

type SpotIcon = typeof Asterisk;
type RowId = React.ComponentProps<typeof CardMoreIcon>["rowId"];

function iconOf(rowId: RowId): SpotIcon {
  return (CardMoreIcon({ rowId }) as React.ReactElement<{ icon: SpotIcon }>).props.icon;
}

function iconNames(rowId: RowId, expected: SpotIcon): readonly string[] {
  const tree = render(
    <>
      {React.createElement(iconOf(rowId))}
      {React.createElement(expected)}
    </>,
  ).toJSON() as unknown as readonly Readonly<{ type: string }>[];

  return tree.map(node => node.type);
}

describe("CardMoreRowParts (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("calls the row handler when the list item is pressed", () => {
    const onPress = jest.fn();
    render(
      <CardMoreListItem rowId="logout" onPress={onPress}>
        <CardMoreIcon rowId="logout" />
      </CardMoreListItem>,
    );

    fireEvent.press(screen.getByTestId("card-more-row-logout"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["managePin", Asterisk],
    ["accessBaanx", Settings],
    ["help", Question],
    ["logout", ExitLogout],
  ] as const)("gives the %s row its own icon", (rowId, expected) => {
    const [actualName, expectedName] = iconNames(rowId, expected);

    expect(actualName).toBe(expectedName);
  });
});
