import { apiClient } from "../network/api";
import { AleoJWT } from "../types/api";

export async function getAccountJWT(apiKey: string, consumerId: string): Promise<AleoJWT> {
  const res = await apiClient.getAccountJWT(apiKey, consumerId);
  const data = {
    token: res.headers?.["authorization"] ?? "",
    exp: res.data.exp,
  };

  return data;
}
