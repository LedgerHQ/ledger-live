// const API_BASE = "https://api.kaspa.org";
import { getEnv } from "@ledgerhq/live-env";

const API_BASE = getEnv("API_KASPA_ENDPOINT");

export { API_BASE };
