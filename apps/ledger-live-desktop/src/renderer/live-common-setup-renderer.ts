import { setupBase } from "~/live-common-setup-base";
import { osPlatform, osRelease } from "~/system";

// Side-effect module: must be imported before any currency or family module.
setupBase({ platformOS: osPlatform(), platformVersion: osRelease() });
