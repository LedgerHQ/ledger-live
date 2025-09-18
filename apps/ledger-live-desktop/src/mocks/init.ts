async function enableMocking() {
  const mswEnabled = process.env.ENABLE_MSW === "true";

  if (mswEnabled) {
    try {
      const { startWorker } = await import("~/mocks/browser");

      await startWorker();
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
