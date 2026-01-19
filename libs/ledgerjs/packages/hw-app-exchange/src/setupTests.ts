// Handle unhandled promise rejections in tests to prevent worker crashes
// This is a workaround for tests that throw unhandled errors
// Jest 20 is more strict about unhandled rejections, so we need to handle them properly
if (typeof process !== "undefined" && process.on) {
  process.on("unhandledRejection", (reason: unknown) => {
    // Suppress TransportStatusError unhandled rejections in tests
    // These are expected in some tests and will be caught by the test framework
    if (reason && typeof reason === "object" && "statusCode" in reason) {
      // This is a TransportStatusError, which is expected in some tests
      // Don't let it crash the test worker
      return;
    }
    // For other errors, let Jest handle them
    throw reason;
  });
}
