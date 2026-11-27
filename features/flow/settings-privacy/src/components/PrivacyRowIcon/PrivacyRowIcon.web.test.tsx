import React from "react";
import { render } from "@testing-library/react";
import { PrivacyRowIcon } from "./PrivacyRowIcon";

describe("PrivacyRowIcon", () => {
  it.each([
    "bugReports",
    "appPerformance",
    "personalizedExperience",
    "analytics",
    "privacyPolicy",
  ] as const)("shows an icon for %s", id => {
    const { container } = render(<PrivacyRowIcon id={id} />);

    expect(container).not.toBeEmptyDOMElement();
  });
});
