import { getEnv } from "@ledgerhq/live-env";
import { sdk as normalSdk } from "./sdk";
import { mockSdk } from "./mockSdk";

export const sdk = getEnv("MOCK") ? mockSdk : normalSdk;
export const getSdk = () => getEnv("MOCK") ? mockSdk : normalSdk;
