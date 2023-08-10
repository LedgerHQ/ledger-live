import { getEnv } from "../../../env";

export const isPlaywrightEnv = () => getEnv("MOCK") && !getEnv("PLAYWRIGHT_RUN");
