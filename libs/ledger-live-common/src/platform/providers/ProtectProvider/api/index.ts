import network from "../../../../network";
import { ProtectData } from "../types";

const ACCOUNT_API_URL = "https://protect-account-simu-stg.aws.stg.ldg-tech.com";

export async function login(
  email: string,
  password: string
): Promise<ProtectData> {
  const { data } = await network({
    method: "POST",
    url: `${ACCOUNT_API_URL}/account/sign-in`,
    data: {
      email,
      password,
    },
  });

  return data as ProtectData;
}

export async function refreshToken(refreshToken: string): Promise<ProtectData> {
  const { data } = await network({
    method: "POST",
    url: `${ACCOUNT_API_URL}/account/refresh-token`,
    data: {
      refreshToken: refreshToken,
    },
  });

  return data as ProtectData;
}
