/* eslint-disable i18next/no-literal-string */
import * as React from "react";

import LText from ".";
import { render } from "../../__test__/test-renderer";

describe("LText", () => {
  it("Should render text correctly", () => {
    const { getByTestId } = render(
      <LText color="#000" testID="helloworld">
        Hello World
      </LText>,
    );

    const ltext = getByTestId("helloworld");

    expect(ltext).toHaveTextContent("Hello World");
    expect(ltext).toHaveStyle({ color: "#000" });
  });
});
