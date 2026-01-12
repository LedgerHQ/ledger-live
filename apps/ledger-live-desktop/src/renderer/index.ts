import "./pre";
import "~/renderer/env";
import "~/renderer/experimental"; // NB we need to load this first because it loads things from process.env and will setEnv properly at boot
import "~/renderer/init";

if (process.env.MSW_ENABLED === "true") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("~/mocks/init");
}
