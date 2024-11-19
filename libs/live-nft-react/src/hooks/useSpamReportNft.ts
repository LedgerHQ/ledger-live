import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NFTS_QUERY_KEY } from "../queryKeys";
import { reportSpamNtf, NftSpamReportOpts } from "@ledgerhq/live-nft/api/simplehash";
import { SpamReportNftResult } from "./types";

export const useSpamReportNft = (): SpamReportNftResult => {
  const queryClient = useQueryClient();
  const spamReportMutation = useMutation({
    mutationFn: (opts: NftSpamReportOpts) => reportSpamNtf(opts),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [NFTS_QUERY_KEY.SpamFilter] }),
  });

  return spamReportMutation;
};
