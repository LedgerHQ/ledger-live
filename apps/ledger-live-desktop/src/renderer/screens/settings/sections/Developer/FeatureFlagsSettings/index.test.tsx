import React from "react";
import { render, screen } from "tests/testSetup";
import { FeatureFlagContent } from "./index";

jest.mock("~/firebase-setup", () => ({
  getFirebaseConfig: () => ({ projectId: "ledger-live-staging" }),
}));

describe("FeatureFlagContent", () => {
  it("shows the Firebase project from the build env", () => {
    render(<FeatureFlagContent expanded />);

    expect(screen.getByText("ledger-live-staging")).toBeVisible();
  });
});
