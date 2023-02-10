import { useEffect, useState } from "react";
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

  const getCryptoPanicPosts = async ({ page = 1, concatPosts = false }) => {
    try {
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
  };

  // Init
  useEffect(() => {
    if (ready || isLoading) return;
    getCryptoPanicPosts({ page: 1 });
  }, []);

  const refresh = () => {
    if (!ready || isLoading) return;
    getCryptoPanicPosts({ page: 1 });
  };

  const loadMore = () => {
    if (!ready || isLoading || !hasMore) return;
    getCryptoPanicPosts({ page: currentPage + 1, concatPosts: true });
  };

  return { posts, hasMore, ready, isLoading, refresh, loadMore };
}
