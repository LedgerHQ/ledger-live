import { useCallback, useEffect, useState } from "react";
import {
  CryptopanicGetParams,
  CryptopanicNewsWithMetadata,
  getPosts,
} from "./cryptopanicApi";

export async function useCryptopanicPosts(params: CryptopanicGetParams) {
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [posts, setPosts] = useState<CryptopanicNewsWithMetadata[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const getCryptoPanicPosts = useCallback(
    async ({ page = 1, concatPosts = false }) => {
      try {
        setIsLoading(true);
        const apiResult = await getPosts({ ...params, page });
        if (concatPosts) {
          setPosts(currentPosts => currentPosts.concat(apiResult.results));
        } else {
          setPosts(apiResult.results);
        }
        setHasMore(!!apiResult.next);
        setCurrentPage(page);
      } catch (e) {
        // handle error
      }
      setIsLoading(false);
      setReady(true);
    },
    // maybe spread params object to array to reduce re-render
    [params],
  );

  // Init
  useEffect(() => {
    if (ready || isLoading) return;
    getCryptoPanicPosts({ page: 1 });
  }, [getCryptoPanicPosts, isLoading, ready]);

  const refresh = useCallback(async () => {
    if (!ready || isLoading) return;
    await getCryptoPanicPosts({ page: 1 });
  }, [getCryptoPanicPosts, isLoading, ready]);

  const loadMore = useCallback(async () => {
    if (!ready || isLoading || !hasMore) return;
    await getCryptoPanicPosts({ page: currentPage + 1, concatPosts: true });
  }, [currentPage, getCryptoPanicPosts, hasMore, isLoading, ready]);

  return { posts, hasMore, ready, isLoading, refresh, loadMore };
}
