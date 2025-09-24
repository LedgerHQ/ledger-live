import { getEnv } from "@ledgerhq/live-env";
import type {
  ServiceStatusApi,
  ServiceStatusSummary,
} from "@ledgerhq/live-common/notifications/ServiceStatusProvider/types";

async function fetchStatusSummary(): Promise<ServiceStatusSummary> {
  const base = getEnv("STATUS_API_URL");
  const version = getEnv("STATUS_API_VERSION");
  const url = `${base}/v${version}/summary.json`;
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

const api: ServiceStatusApi = {
  fetchStatusSummary,
};

export default api;
