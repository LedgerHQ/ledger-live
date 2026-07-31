// Wire the framework currencies resolver before `./fixtures` is imported below: this file runs in
// `setupFiles` (before `setupFilesAfterEnv`), and fixtures.ts resolves currencies at module-eval time.
import "@ledgerhq/wallet-framework-test-setup";

global.console = require("console");
