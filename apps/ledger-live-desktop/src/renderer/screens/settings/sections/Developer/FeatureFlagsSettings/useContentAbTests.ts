import { useEffect, useState } from "react";
import {
  getContentAbTests,
  subscribeToContentAbTests,
  type ContentAbTests,
} from "@features/platform-content-ab-tests";

/**
 * `getContentAbTests` builds a fresh object on every call, so this subscribes rather than using
 * `useSyncExternalStore`, which requires a cached snapshot.
 */
export function useContentAbTests(): ContentAbTests {
  const [contentAbTests, setContentAbTests] = useState<ContentAbTests>(getContentAbTests);
  useEffect(() => subscribeToContentAbTests(setContentAbTests), []);
  return contentAbTests;
}
