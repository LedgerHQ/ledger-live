import { useSyncExternalStore } from "react";
import { getContentAbTestCopy, subscribeToContentAbTestCopy } from "~/firebase/contentAbTestCopy";

export function useContentAbTestCopyUpdates(): void {
  useSyncExternalStore(subscribeToContentAbTestCopy, getContentAbTestCopy, getContentAbTestCopy);
}
