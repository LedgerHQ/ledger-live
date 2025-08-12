import "./pre";
import "~/renderer/env";
import "~/renderer/experimental"; // NB we need to load this first because it loads things from process.env and will setEnv properly at boot
import "~/mocks/init"; // Initialize Mock Fetch for API mocking
import "~/renderer/init";
