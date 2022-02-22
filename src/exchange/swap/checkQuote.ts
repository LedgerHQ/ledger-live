import type { CheckQuote } from "./types";

import { getEnv } from "../../env";
import { mockCheckQuote } from "./mock";
import { getSwapAPIError, getSwapAPIBaseURL } from "./";
import network from "../../network";

const checkQuote: CheckQuote = async ({ provider, quoteId, bearerToken }) => {
  if (getEnv("MOCK")) {
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
