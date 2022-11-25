import network from "../../../../network";
import { ProtectData } from "../types";

export async function login(): Promise<ProtectData> {
  const { data } = await network({
    method: "POST",
    url: "https://stargate-url/account/sign-in",
    data: {
      email: "email",
      password: "password",
    },
  });

  return data as ProtectData;
}

export async function refreshToken(refreshToken: string): Promise<ProtectData> {
  const { data } = await network({
    method: "POST",
    url: "https://stargate-url/account/refresh-token",
    data: {
      refreshToken: refreshToken,
    },
  });

  return data as ProtectData;
}
