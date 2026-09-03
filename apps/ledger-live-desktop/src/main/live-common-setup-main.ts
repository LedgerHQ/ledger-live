import os from "os";
import { setupBase } from "~/live-common-setup-base";

// Side-effect module: kept separate so it can be imported in the same position the old
// `import "~/live-common-setup-base"` occupied, preserving the guarantee that the currency
// resolver is registered before any currency or family module is evaluated.
setupBase({ platformOS: process.platform, platformVersion: os.release() });
