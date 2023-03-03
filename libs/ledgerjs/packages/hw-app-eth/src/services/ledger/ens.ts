import axios from "axios";

import { LoadConfig } from "../types";
import { getLoadConfig } from "./loadConfig";

export type Registry = "ens";

type GetRecipientNamePayloadResponse = {
  payload: string;
};

export const fetchRecipientNamePayload = async (
  recipientName: string,
  registry: Registry,
  loadConfig: LoadConfig,
  challenge?: string
): Promise<string> => {
  const { nftMetadataBaseURL: BASE_URL } = getLoadConfig(loadConfig);
  const endpoint = `${BASE_URL}/names/${registry}/forward/${recipientName}`;

  const { data } = await axios.get<GetRecipientNamePayloadResponse>(endpoint, {
    params: { challenge },
  });

  const { payload } = data;

  return payload;
};
