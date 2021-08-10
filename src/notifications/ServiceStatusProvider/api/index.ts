import type { ServiceStatusApi } from "../types";
import prodApi from "./api";

const api: ServiceStatusApi = {
  fetchStatusSummary: () => prodApi.fetchStatusSummary(),
};

export default api;
