import { sdk as normalSdk } from "./sdk";
import { mockSdk } from "./mockSdk";
import { TrustchainSDK } from "./types";

export const getSdk = (isMockEnv: boolean): TrustchainSDK => (isMockEnv ? mockSdk : normalSdk);
