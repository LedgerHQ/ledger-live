import React from "react";
import { render } from "@testing-library/react-native";
import { PrivacyRowIcon } from "./PrivacyRowIcon";

describe("PrivacyRowIcon on mobile", () => {
  it.each([
    "bugReports",
    "appPerformance",
    "personalizedExperience",
    "analytics",
    "privacyPolicy",
  ] as const)("shows an icon for %s", id => {
    expect(render(<PrivacyRowIcon id={id} />).toJSON()).not.toBeNull();
  });
});
