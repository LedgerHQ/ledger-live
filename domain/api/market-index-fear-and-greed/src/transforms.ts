import type { FearAndGreedIndex } from "@domain/entity-market-index-fear-and-greed";
import { FearAndGreedResponseSchema } from "./schema";

/** Validates the raw CMC response and maps it to the canonical {@link FearAndGreedIndex}. */
export function transformFearAndGreedResponse(response: unknown): FearAndGreedIndex {
  const { data } = FearAndGreedResponseSchema.parse(response);
  return {
    value: data.value,
    classification: data.value_classification,
  };
}
