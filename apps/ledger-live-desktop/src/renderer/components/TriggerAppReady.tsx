import React, { useEffect } from "react";

/**
 * Notifies the preloader to hide the loader and show the app.
 * Deferred with double requestAnimationFrame so the first screen has time to paint.
 * React 19's concurrent rendering can commit the shell before route content;
 * waiting one frame after layout ensures the background screen is ready when the loader disappears.
 */
const TriggerAppReady = () => {
  useEffect(() => {
    let cancelled = false;
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) {
          window.api?.appLoaded();
        }
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
