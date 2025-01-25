import { useMutation } from "@tanstack/react-query";
import { refreshMetadata, RefreshOpts } from "@ledgerhq/live-nft/api/simplehash";
import { RefreshMetadataResult } from "./types";

export function useRefreshMetadata(): RefreshMetadataResult {
  const refreshMetadataMutation = useMutation({
    mutationFn: (opts: RefreshOpts) => refreshMetadata(opts),
  });

  return refreshMetadataMutation;
}
