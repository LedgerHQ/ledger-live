async function enableMocking() {
  const mockFetchEnabled = process.env.ENABLE_MOCK_FETCH === "true";

  if (!mockFetchEnabled) {
    return;
  }

  try {
    console.log("Mock Fetch: Starting Mock Service Worker (fetch interceptor)...");
    const { worker } = await import("~/mocks/browser");

    await worker.start();

    console.log("Mock Fetch: Mock Service Worker started successfully");
  } catch (error) {
    console.error("Mock Fetch: Failed to start Mock Service Worker:", error);
  }
}

enableMocking();
