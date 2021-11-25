import type { CheckQuote } from "./types";

// import { getEnv } from "../../env";
import { mockCheckQuote } from "./mock";

const checkQuote: CheckQuote = async ({ quoteId, bearerToken }) => {
  //   if (getEnv("MOCK"))

  return mockCheckQuote({ quoteId, bearerToken });
};

export default checkQuote;
