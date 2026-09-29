import { useSyncExternalStore } from "react";
import {
  getContentAbTests,
  subscribeToContentAbTests,
} from "@features/platform-content-ab-tests";

export function useContentAbTests() {
  return useSyncExternalStore(subscribeToContentAbTests, getContentAbTests, getContentAbTests);
}
