import Config from "react-native-config";
import { e2eAppConfigStorage } from "~/e2e/appConfigStorage";
import { loadAppConfig, profileOf } from "./load";
import { appConfigStorage } from "./storage";

/**
 * Only e2e builds (`E2E` or `DETOX`) may read the launch arguments: on Android, any app that starts this one can
 * set them as intent extras.
 */
const storage = Config.E2E || Config.DETOX ? e2eAppConfigStorage : appConfigStorage;

/** The configuration of this session, resolved once when this module is evaluated. */
export const { config: appConfig, session: appConfigSession } = loadAppConfig(
  storage,
  profileOf(Config.CONFIG_PROFILE, __DEV__),
);
