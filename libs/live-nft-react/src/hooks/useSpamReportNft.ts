import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NFTS_QUERY_KEY } from "../queryKeys";
import { reportSpamNtf, NftSpamReportOpts } from "@ledgerhq/live-nft/api/simplehash";

export const useSpamReportNft = () => {
  const queryClient = useQueryClient();
  const spamReportMutation = useMutation({
    mutationFn: (opts: NftSpamReportOpts) => reportSpamNtf(opts),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [NFTS_QUERY_KEY.SpamFilter] }),
  });

  return spamReportMutation;
};
