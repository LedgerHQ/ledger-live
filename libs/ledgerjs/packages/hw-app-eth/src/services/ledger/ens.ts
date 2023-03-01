import axios from "axios";

import { LoadConfig } from "../types";
import { getLoadConfig } from "./loadConfig";

export type Registry = "ens";

type GetReverseNameResponse = {
  payload: string;
};

export const fetchENSPayload = async (
  registry: Registry,
  address: string,
  loadConfig: LoadConfig,
  challenge?: string
): Promise<string> => {
  const { domainNameBaseURL: BASE_URL } = getLoadConfig(loadConfig);
  const endpoint = `${BASE_URL}/names/${registry}/reverse/${address}`;
  console.log(endpoint);

  const { data } = await axios.get<GetReverseNameResponse>(endpoint, {
    params: { challenge },
  });
  const { payload } = data;

  console.log(payload);

  return payload;
};
