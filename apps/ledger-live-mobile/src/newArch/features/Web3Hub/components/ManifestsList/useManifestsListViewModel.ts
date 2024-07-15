import { useInfiniteQuery } from "@tanstack/react-query";
import {
  fetchManifestsMock,
  selectManifests,
  getNextPageParam,
} from "LLM/features/Web3Hub/utils/api/manifests";

export const queryKey = (selectedCategory: string) => ["web3hub/manifests", selectedCategory];

export default function useManifestListViewModel(selectedCategory: string) {
  const manifestsQuery = useInfiniteQuery({
    queryKey: queryKey(selectedCategory),
    queryFn: fetchManifestsMock(selectedCategory, ""),
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
