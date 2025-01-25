import { getEnv } from "@ledgerhq/live-env";

export const isIntegrationTestEnv = () => getEnv("MOCK") && !getEnv("PLAYWRIGHT_RUN");
export const isSwapDisableAppsInstall = () => getEnv("SWAP_DISABLE_APPS_INSTALL");
