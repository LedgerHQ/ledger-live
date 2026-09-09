import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardActions } from "./CardActions";

describe("CardActions (native)", () => {
  it("renders nothing: native hosts mount Freeze and More separately", () => {
    render(<CardActions />);

    expect(screen.queryByTestId("more-tile")).toBeNull();
  });
});
