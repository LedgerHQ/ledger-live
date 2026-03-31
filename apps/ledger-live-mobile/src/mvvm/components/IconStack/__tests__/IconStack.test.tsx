import React from "react";
import { View } from "react-native";
import { render } from "@tests/test-renderer";
import { IconStack } from "../index";

describe("IconStack", () => {
  it("renders all children", () => {
    const { getAllByTestId } = render(
      <IconStack size={20} testID="icon-stack">
        <View testID="icon-child" />
        <View testID="icon-child" />
        <View testID="icon-child" />
      </IconStack>,
    );

    expect(getAllByTestId("icon-child")).toHaveLength(3);
  });

  it("renders container with provided testID", () => {
    const { getByTestId } = render(
      <IconStack size={20} testID="my-stack">
        <View />
      </IconStack>,
    );

    expect(getByTestId("my-stack")).toBeTruthy();
  });

  it("skips invalid children", () => {
    const { queryAllByTestId } = render(
      <IconStack size={20} testID="icon-stack">
        <View testID="valid-child" />
        {null}
        {false}
        <View testID="valid-child" />
      </IconStack>,
    );

    expect(queryAllByTestId("valid-child")).toHaveLength(2);
  });

  it("renders nothing when given no children", () => {
    const { getByTestId } = render(<IconStack size={20} testID="empty-stack" />);
    const container = getByTestId("empty-stack");
    expect(container.children).toHaveLength(0);
  });
});
