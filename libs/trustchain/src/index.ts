import { getEnv } from "@ledgerhq/live-env";
import { sdk as normalSdk } from "./sdk";
import { mockSdk } from "./mockSdk";
import { TrustchainSDK } from "./types";

export const getSdk = (): TrustchainSDK => (getEnv("MOCK") ? mockSdk : normalSdk);
