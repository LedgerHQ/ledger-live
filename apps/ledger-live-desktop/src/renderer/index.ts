import "./pre";
import "~/renderer/experimental"; // NB loads things from process.env and setEnvs them at boot, so it must stay early
import "~/mocks/init"; // Initialize MSW (Mock Service Worker) for API mocking
import "~/renderer/init";
