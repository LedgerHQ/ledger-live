import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import { AxiosError } from "axios";
import { MINA_API_RETRY_COUNT, MINA_ROSETTA_TIMEOUT } from "../consts";

export const makeNetworkRequest = async <T>({
  method,
  url,
  data,
  timeout = MINA_ROSETTA_TIMEOUT,
  retryCount = 0,
}: {
  method: "POST" | "GET";
  url: string;
  data: any;
  timeout?: number;
  retryCount?: number;
}): Promise<T> => {
  try {
    const response = await network<T>({ method, url, timeout, data });
    if (response.status === 504 && retryCount < MINA_API_RETRY_COUNT) {
      log("debug", "[MINA] (makeNetworkRequest) Request timed out, retrying...");
      return await makeNetworkRequest<T>({
        method,
        url,
        data,
        timeout,
        retryCount: retryCount + 1,
      });
    } else if (response.status !== 200) {
      const errorData =
        typeof response.data === "object" ? JSON.stringify(response.data) : response.data;
      log("error", `[MINA] (makeNetworkRequest) Error: ${errorData}, status: ${response.status}`);
      throw new Error(String(errorData));
    }
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.code === "ECONNABORTED") {
      log("error", "[MINA] (makeNetworkRequest) Error ECONNABORTED: ", error.message);
      if (retryCount < MINA_API_RETRY_COUNT) {
        return await makeNetworkRequest<T>({
          method,
          url,
          data,
          timeout,
          retryCount: retryCount + 1,
        });
      }
      throw error;
    }

    if (error instanceof Error) {
      log("error", "[MINA] (makeNetworkRequest) Error: ", error.message);
      throw error;
    }

    log("error", "[MINA] (makeNetworkRequest) Error unknown: ", error);
    throw error;
  }
};
