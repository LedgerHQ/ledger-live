import React, { useEffect } from "react";

/**
 * Notifies the preloader to hide the loader and show the app.
 * Uses requestIdleCallback so the browser waits until React 19's concurrent
 * rendering settles (including Suspense boundary commits) before hiding the
 * loader.  A subsequent requestAnimationFrame ensures the painted frame is
 * up-to-date.  Falls back to a triple-rAF chain when requestIdleCallback is
 * unavailable.
 */
const TriggerAppReady = () => {
  useEffect(() => {
    let cancelled = false;

    const notifyReady = () => {
      if (!cancelled) {
        window.api?.appLoaded();
      }
    };

    if (typeof requestIdleCallback === "function") {
      const idleId = requestIdleCallback(() => requestAnimationFrame(notifyReady), {
        timeout: 3000,
      });
      return () => {
        cancelled = true;
        cancelIdleCallback(idleId);
      };
    }

    // Fallback: triple rAF gives an extra frame for concurrent renders to flush.
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(notifyReady);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, []);
  return <div id="__app__ready__" />;
};

export default TriggerAppReady;
