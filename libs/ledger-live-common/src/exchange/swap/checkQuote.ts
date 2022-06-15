import { getEnv } from "../../env";
import network from "../../network";
import { getSwapAPIBaseURL, getSwapAPIError } from "./";
import { mockCheckQuote } from "./mock";
import type { CheckQuote } from "./types";

const checkQuote: CheckQuote = async ({ provider, quoteId, bearerToken }) => {
  if (getEnv("MOCK") || getEnv("MOCK_SWAP_CHECK_QUOTE")) {
    return mockCheckQuote({ provider, quoteId, bearerToken });
  }

  const request = {
    provider,
    rateId: quoteId,
  };

  const { data } = await network({
    method: "POST",
    url: `${getSwapAPIBaseURL()}/rate/check`,
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
    data: request,
  });

  const error =
    data.code === 300 ? getSwapAPIError(data.code, data.message) : undefined;
  if (error) {
    return {
      provider,
      error,
    };
  }

  return data;
};

export default checkQuote;
