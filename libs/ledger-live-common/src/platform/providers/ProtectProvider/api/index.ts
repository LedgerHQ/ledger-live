import network from "../../../../network";
import { ProtectData } from "../types";

const ACCOUNT_API_URLS = {
  STAGING: "https://stargate-portal-stg.api.aws.stg.ldg-tech.com",
  SIMU: "https://stargate-portal-simu-stg.api.aws.stg.ldg-tech.com",
  SEC: "https://stargate-portal-sec.api.aws.sec.ldg-tech.com",
};

const ACCOUNT_API_URL = ACCOUNT_API_URLS.STAGING;

export async function login(
  email: string,
  password: string
): Promise<ProtectData | undefined> {
  try {
    const { data } = await network({
      method: "POST",
      url: `${ACCOUNT_API_URL}/account/sign-in`,
      data: {
        email,
        password,
      },
    });

    return data as ProtectData;
  } catch (error) {
    return undefined;
  }
}

export async function refreshToken(
  refreshToken: string
): Promise<ProtectData | undefined> {
  try {
    const { data } = await network({
      method: "POST",
      url: `${ACCOUNT_API_URL}/account/refresh-token`,
      data: {
        refresh_token: refreshToken,
      },
    });

    return data as ProtectData;
  } catch (error) {
    return undefined;
  }
}

export async function forgotPassword(email: string): Promise<any> {
  return await network({
    method: "POST",
    url: `${ACCOUNT_API_URL}/account/reset-password`,
    data: { email },
  });
}
