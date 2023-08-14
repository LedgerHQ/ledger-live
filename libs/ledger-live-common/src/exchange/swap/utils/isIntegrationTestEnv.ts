import { getEnv } from "../../../env";

export const isIntegrationTestEnv = () => getEnv("MOCK") && !getEnv("PLAYWRIGHT_RUN");
