import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { FeatureFlagContent } from "./index";

jest.mock("~/firebase-setup", () => ({
  getFirebaseConfig: () => ({ projectId: "ledger-live-staging" }),
}));

describe("FeatureFlagContent", () => {
  it("shows the Firebase project from the build env, not the remote flag value", () => {
    render(<FeatureFlagContent expanded />, {
      initialState: withFlagOverrides({
        firebaseEnvironmentReadOnly: { params: { project: "ledger-live-production" } },
      }),
    });

    expect(screen.getByText("ledger-live-staging")).toBeVisible();
    expect(screen.queryByText("ledger-live-production")).toBeNull();
  });
});
