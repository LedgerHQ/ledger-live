// @flow

import { getEnv } from "../../../env";
import type { ServiceStatusApi } from "../types";
import prodApi from "./api";
import mockApi from "./api.mock";

const api: ServiceStatusApi = {
  fetchStatusSummary: () =>
    getEnv("MOCK")
      ? mockApi.fetchStatusSummary()
      : prodApi.fetchStatusSummary(),
};

export default api;
