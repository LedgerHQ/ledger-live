import { z } from "zod";
import { log } from "@ledgerhq/logs";
import {
  FearAndGreedIndex,
  FearAndGreedResponseSchema,
  AltcoinSeasonIndex,
  AltcoinSeasonIndexResponseSchema,
} from "./types";

function parseOrThrow<T extends z.ZodTypeAny>(schema: T, response: unknown): z.infer<T> {
  const result = schema.safeParse(response);

  if (!result.success) {
    log("cmc-client", "Invalid response schema:", {
      errors: result.error.issues,
      received: response,
    });
    throw new Error(
      `[CMC API] Schema validation failed: ${result.error.issues
        .map(e => `${e.path.join(".")}: ${e.message}`)
        .join(", ")}`,
    );
  }

  return result.data;
}

export function transformFearAndGreedResponse(response: unknown): FearAndGreedIndex {
  const { data } = parseOrThrow(FearAndGreedResponseSchema, response);
  return {
    value: data.value,
    classification: data.value_classification,
  };
}

export function transformAltcoinSeasonIndexResponse(response: unknown): AltcoinSeasonIndex {
  const { data } = parseOrThrow(AltcoinSeasonIndexResponseSchema, response);
  return {
    value: data.altcoin_index,
    altcoinMarketcap: data.altcoin_marketcap,
  };
}
