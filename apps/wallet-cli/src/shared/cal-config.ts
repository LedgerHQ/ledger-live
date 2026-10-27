import { getEnv } from "@shared/env";
import { ledgerClientVersion } from "./client-version";

export const calApiConfig = { calServiceUrl: getEnv("CAL_SERVICE_URL"), ledgerClientVersion };
