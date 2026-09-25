import { useSyncExternalStore } from "react";
import { getContentAbTests, subscribeToContentAbTests } from "~/firebase/contentAbTestCopy";

export function useContentAbTests() {
  return useSyncExternalStore(subscribeToContentAbTests, getContentAbTests, getContentAbTests);
}
