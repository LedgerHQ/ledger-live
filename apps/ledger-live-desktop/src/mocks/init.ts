async function enableMocking() {
  const mswEnabled = process.env.ENABLE_MSW === "true";

  if (mswEnabled) {
    try {
      const { startWorker, toggleSimulate500Error } = await import("~/mocks/browser");

      await startWorker();

      // Expose toggle function globally for debugging
      if (__DEV__) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
        const globalWindow = window as any;
        globalWindow.__LEDGER_LIVE__ = {
          ...globalWindow.__LEDGER_LIVE__,
          toggleSimulate500Error,
        };
        console.log(
          "[MSW] Use window.__LEDGER_LIVE__.toggleSimulate500Error(true/false) to simulate 500 errors",
        );
      }
    } catch (error) {
      console.error("MSW: Failed to start Mock Service Worker:", error);
    }
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  const mswRegistrations = registrations.filter(registration =>
    registration.active?.scriptURL.includes("mockServiceWorker"),
  );
  await Promise.all(
    mswRegistrations.map(async registration => {
      await registration.unregister();
    }),
  );
}

enableMocking();
