async function enableMocking() {
  const mswEnabled = process.env.MSW_ENABLED === "true";

  if (!mswEnabled) {
    return;
  }

  try {
    await import("./polyfills");
    const serverModule = await import("./server");
    const mswWorker = serverModule.mswWorker;
    // eslint-disable-next-line no-console
    console.log("\x1b[32m MSW: Starting Mock Service Worker \x1b[0m");
    mswWorker.listen({
      onUnhandledRequest: "bypass",
    });
  } catch (error) {
    console.error("\x1b[41m MSW: Failed to start Mock Service Worker \x1b[0m", error);
  }
}

enableMocking();
