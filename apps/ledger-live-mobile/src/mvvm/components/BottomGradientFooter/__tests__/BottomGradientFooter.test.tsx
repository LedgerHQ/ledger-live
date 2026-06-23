import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { BottomGradientFooter } from "../index";

describe("BottomGradientFooter", () => {
  it("renders children and forwards testID", () => {
    render(
      <BottomGradientFooter testID="bottom-gradient-footer">
        <Text>Add account</Text>
      </BottomGradientFooter>,
    );

    expect(screen.getByTestId("bottom-gradient-footer")).toBeVisible();
    expect(screen.getByText("Add account")).toBeVisible();
  });
});
