import network from "../../../../network";
import { ProtectData } from "../types";
import protectConfig from "../config";

const { stargatePortalUrl } = protectConfig;

export async function login(
  email: string,
  password: string
): Promise<ProtectData | undefined> {
  try {
    const { data } = await network({
      method: "POST",
      url: `${stargatePortalUrl}/account/sign-in`,
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
      url: `${stargatePortalUrl}/account/refresh-token`,
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
    url: `${stargatePortalUrl}/account/reset-password`,
    data: { email },
  });
}
