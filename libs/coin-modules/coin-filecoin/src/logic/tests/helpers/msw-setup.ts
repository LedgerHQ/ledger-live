/**
 * Jest setupFilesAfterEnv for MSW tests.
 *
 * Importing msw/node here ensures that MSW's request interceptors are
 * installed before any test module loads `@ledgerhq/live-network` (axios).
 * Each test file manages its own server.listen() / server.close() lifecycle.
 */
import "msw/node";
