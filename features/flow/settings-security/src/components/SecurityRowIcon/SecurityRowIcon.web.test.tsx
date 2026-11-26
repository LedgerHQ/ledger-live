import React from "react";
import { render } from "@testing-library/react";
import { SecurityRowIcon } from "./SecurityRowIcon";

describe("SecurityRowIcon", () => {
  it.each(["hideBalance", "appLock", "mevProtection"] as const)("shows an icon for %s", id => {
    const { container } = render(<SecurityRowIcon id={id} />);

    expect(container).not.toBeEmptyDOMElement();
  });

  it.each(["changePassword", "autoLock", "biometrics"] as const)("shows no icon for %s", id => {
    const { container } = render(<SecurityRowIcon id={id} />);

    expect(container).toBeEmptyDOMElement();
  });
});
