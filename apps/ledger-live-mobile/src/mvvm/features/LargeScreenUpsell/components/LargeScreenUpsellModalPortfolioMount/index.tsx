import React from "react";
import type { PostOnboardingRedirectStatus } from "~/hooks/useAutoRedirectToPostOnboarding";
import { LargeScreenUpsellModalPortfolioMountView } from "./LargeScreenUpsellModalPortfolioMountView";
import { useLargeScreenUpsellModalPortfolioMountViewModel } from "./useLargeScreenUpsellModalPortfolioMountViewModel";

type Props = Readonly<{
  postOnboardingRedirectStatus?: PostOnboardingRedirectStatus;
}>;

export function LargeScreenUpsellModalPortfolioMount({
  postOnboardingRedirectStatus = "none",
}: Props) {
  const viewModel = useLargeScreenUpsellModalPortfolioMountViewModel(postOnboardingRedirectStatus);

  if (!viewModel) {
    return null;
  }

  return <LargeScreenUpsellModalPortfolioMountView {...viewModel} />;
}
