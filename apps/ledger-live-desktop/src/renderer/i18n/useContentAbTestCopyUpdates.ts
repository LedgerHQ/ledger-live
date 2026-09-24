import { useSyncExternalStore } from "react";
import {
  getContentAbTestCopyOverrides,
  subscribeToContentAbTestCopyOverrides,
} from "@features/platform-content-ab-tests";

export function useContentAbTestCopyUpdates(): void {
  useSyncExternalStore(
    subscribeToContentAbTestCopyOverrides,
    getContentAbTestCopyOverrides,
    getContentAbTestCopyOverrides,
  );
}
