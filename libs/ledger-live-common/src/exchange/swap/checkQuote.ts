import { getEnv } from "../../env";
import network from "../../network";
import { getSwapAPIBaseURL } from "./";
import { mockCheckQuote } from "./mock";
import type { CheckQuote } from "./types";

// This code is specifically for FTX
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

  /**
   * TODO: we might want to handle various status and error here
   * cf. https://github.com/LedgerHQ/swap/blob/master/modules/model/src/main/scala/co/ledger/swap/model/RateStatus.scala
   */

  return data;
};

export default checkQuote;
