import React from "react";
import PostOnboardingActionView from "./PostOnboardingActionView";
import { usePostOnboardingActionViewModel } from "./usePostOnboardingActionViewModel";
import type { PostOnboardingActionProps } from "./types";

export default function PostOnboardingAction(props: PostOnboardingActionProps) {
  return <PostOnboardingActionView {...usePostOnboardingActionViewModel(props)} />;
}
