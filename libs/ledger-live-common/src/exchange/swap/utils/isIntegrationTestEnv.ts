import { getEnv } from "@ledgerhq/live-env";

export const isIntegrationTestEnv = () => getEnv("MOCK") && !getEnv("PLAYWRIGHT_RUN");
