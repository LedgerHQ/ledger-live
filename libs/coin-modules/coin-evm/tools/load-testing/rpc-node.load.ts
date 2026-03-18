import http from "k6/http";
import { Counter } from "k6/metrics";

const http429 = new Counter("http_429");

export const options = {
  scenarios: {
    rpc_load: {
      executor: "constant-arrival-rate",
      rate: 100,
      timeUnit: "1s",
      duration: "10s",
      preAllocatedVUs: 5,
      maxVUs: 10,
    },
  },
  thresholds: {
    http_429: ["count>=1"],
  },
};

export default function (): void {
  const response = http.post(__ENV.RPC_URL, __ENV.PAYLOAD);

  if (response.status === 429) {
    http429.add(1);
  }
}
