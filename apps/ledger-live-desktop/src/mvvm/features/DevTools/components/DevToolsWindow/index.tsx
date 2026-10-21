import React, { lazy, Suspense, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { StyleSheetManager } from "styled-components";
import { shouldForwardProp } from "~/renderer/styles/shouldForwardProp";
import { closeDevToolsWindow, getDevToolsWindow, subscribeDevToolsWindow } from "./devToolsWindow";

const DevToolsScreen = lazy(() => import("../../screens/DevToolsScreen"));

/** Renders the DevTools panel into its own OS window, sharing the app's store and providers. */
export function DevToolsWindow() {
  const popup = useSyncExternalStore(subscribeDevToolsWindow, getDevToolsWindow);
  if (!popup) return null;

  return createPortal(
    <StyleSheetManager target={popup.document.head} shouldForwardProp={shouldForwardProp}>
      <Suspense fallback={null}>
        <DevToolsScreen onClose={closeDevToolsWindow} />
      </Suspense>
    </StyleSheetManager>,
    popup.document.body,
  );
}
