import { useContext } from "react";
import {
  PostOnboardingContext,
  PostOnboardingDependencies,
} from "../PostOnboardingProvider";

export function usePostOnboardingContext(): PostOnboardingDependencies {
  return useContext(PostOnboardingContext);
}
