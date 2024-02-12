import network from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";
import type { ServiceStatusApi, ServiceStatusSummary } from "../types";

const baseStatusUrl = () => getEnv("STATUS_API_URL");

const statusVersion = () => getEnv("STATUS_API_VERSION");

async function fetchStatusSummary(): Promise<ServiceStatusSummary> {
  const url = `${baseStatusUrl()}/v${statusVersion()}/summary.json`;
  const { data } = await network({
    method: "GET",
    url,
  });
  return data;
}

const api: ServiceStatusApi = {
  fetchStatusSummary,
};
export default api;
