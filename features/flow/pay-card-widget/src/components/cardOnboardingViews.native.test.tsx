import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cardOnboardingDialogProps, cardOnboardingOption } from "../__tests__/fixtures";
import { CardOnboardingDialogView } from "./CardOnboardingDialog/CardOnboardingDialogView";
import { CardOnboardingOptionView } from "./CardOnboardingDialog/CardOnboardingOption/CardOnboardingOptionView";
import { CardOnboardingWidgetCardView } from "./CardOnboardingWidgetCard/CardOnboardingWidgetCardView";

describe("card onboarding native views", () => {
  it("should render nothing until native UI ships", () => {
    expect(renderToStaticMarkup(<CardOnboardingDialogView {...cardOnboardingDialogProps} />)).toBe(
      "",
    );
    expect(renderToStaticMarkup(<CardOnboardingOptionView {...cardOnboardingOption} />)).toBe("");
    expect(
      renderToStaticMarkup(
        <CardOnboardingWidgetCardView
          title="Set up your card"
          completedCount={1}
          totalCount={4}
          handleOpenDialog={() => undefined}
          onboardingCompleted={false}
        />,
      ),
    ).toBe("");
  });
});
