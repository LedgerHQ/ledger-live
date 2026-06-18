import React from "react";
import { render, screen } from "tests/testSetup";
import Main from "../index";

jest.mock("~/renderer/analytics/Track", () => ({
  __esModule: true,
  default: () => null,
}));

describe("Main", () => {
  it("should render the analytics opt-in prompt title", () => {
    render(<Main shouldWeTrack={true} handleOpenPrivacyPolicy={jest.fn()} />, {
      initialRoute: "/",
    });

    expect(screen.getByText("Help us improve and personalize your experience")).toBeVisible();
  });
});
