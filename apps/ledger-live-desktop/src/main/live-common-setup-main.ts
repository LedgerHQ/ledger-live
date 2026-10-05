import os from "node:os";
import { setupBase } from "~/live-common-setup-base";

// Side-effect module: must be imported before any currency or family module.
setupBase({ platformOS: process.platform, platformVersion: os.release() });
