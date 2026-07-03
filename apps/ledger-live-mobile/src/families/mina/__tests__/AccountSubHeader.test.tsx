import React from "react";
import { render, screen } from "@testing-library/react-native";
import MinaAccountSubHeader from "../AccountSubHeader";

jest.mock("~/components/AccountSubHeader", () => {
  const { Text: RNText, View } = require("react-native");
  return {
    __esModule: true,
    default: function MockAccountSubHeader({ family, team }: { family: string; team: string }) {
      return React.createElement(
        View,
        null,
        React.createElement(RNText, null, family),
        React.createElement(RNText, null, team),
      );
    },
  };
});

describe("MinaAccountSubHeader", () => {
  it("renders the account sub header with Mina family", () => {
    render(<MinaAccountSubHeader />);

    expect(screen.getByText("Mina")).toBeOnTheScreen();
  });

  it("displays the team name Zondax", () => {
    render(<MinaAccountSubHeader />);

    expect(screen.getByText("Zondax")).toBeOnTheScreen();
  });
});
