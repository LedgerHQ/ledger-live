// Wire the framework currencies resolver before any test module loads: this file runs in
// `setupFiles` (before `setupFilesAfterEnv`), and fixtures.ts resolves currencies at module-eval.
import "@ledgerhq/wallet-framework-test-setup";

global.console = require("console");
