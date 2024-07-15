import { useInfiniteQuery } from "@tanstack/react-query";
import {
  fetchManifestsMock,
  selectManifests,
  getNextPageParam,
} from "LLM/features/Web3Hub/utils/api/manifests";

export const queryKey = (search: string) => ["web3hub/manifests/search", search];

export default function useSearchListViewModel(search: string) {
  const manifestsQuery = useInfiniteQuery({
    queryKey: queryKey(search),
    queryFn: fetchManifestsMock("", search),
    initialPageParam: 1,
    getNextPageParam,
    select: selectManifests,
  });

  const isLoading = manifestsQuery.isLoading || manifestsQuery.isFetching;

  return {
    data: manifestsQuery.data,
    isLoading,
    onEndReached: manifestsQuery.hasNextPage ? manifestsQuery.fetchNextPage : undefined,
  };
}
