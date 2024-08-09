import { useQuery } from "@tanstack/react-query";
import { NFTS_QUERY_KEY } from "../queryKeys";
import { CheckSpamScoreOpts, getSpamScore } from "@ledgerhq/live-nft/api/simplehash";
import { CheckSpamScoreResult } from "./types";

export const useCheckSpamScore = (opts: CheckSpamScoreOpts): CheckSpamScoreResult => {
  return useQuery({
    queryKey: [NFTS_QUERY_KEY.CheckSpamScore, opts],
    queryFn: () => getSpamScore(opts),
    enabled: false,
    retry: false,
  });
};
