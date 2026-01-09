import { FearAndGreedResponse, FearAndGreedResponseSchema } from "../state-manager/types";

export const mockFearAndGreedLatest: FearAndGreedResponse = {
  data: {
    value: 49,
    value_classification: "Neutral",
    update_time: "2024-09-19T23:45:56.817Z",
  },
  status: {
    timestamp: "2026-01-07T15:08:19.975Z",
    error_code: "0",
    error_message: "",
    elapsed: 10,
    credit_count: 0,
  },
};

FearAndGreedResponseSchema.parse(mockFearAndGreedLatest);
