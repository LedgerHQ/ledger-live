import React from "react";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { render, screen } from "tests/testSetup";
import PostOnboardingAction from "LLD/features/FinishOnboarding/FinishOnboardingDialog/components/PostOnboardingAction";
import { getLumenSymbolForActionId } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/utils";

describe("PostOnboardingAction integration", () => {
  it("should show title and description and use the custom test id", () => {
    render(
      <PostOnboardingAction
        title="Transfer assets"
        description="Move funds from an exchange"
        completed={false}
        onAction={jest.fn()}
        testId="my-action"
        postOnboardingActionId={PostOnboardingActionId.assetsTransfer}
        lumenSymbol={getLumenSymbolForActionId(PostOnboardingActionId.assetsTransfer)}
        deviceModelId={null}
        isLedgerSyncActive={false}
        accounts={[]}
        startAction={() => {}}
        buttonLabelForAnalyticsEvent=""
        shouldCompleteOnStart={false}
      />,
    );
    expect(screen.getByText("Transfer assets")).toBeVisible();
    expect(screen.getByText("Move funds from an exchange")).toBeVisible();
    const row = screen.getByTestId("my-action");
    expect(row).toBeVisible();
    expect(row).toHaveAttribute("data-post-onboarding-action-id", PostOnboardingActionId.assetsTransfer);
  });
});
