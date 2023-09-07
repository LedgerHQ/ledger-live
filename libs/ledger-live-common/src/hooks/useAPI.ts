import { useState, useEffect, useCallback } from "react";

type AsyncFn<T, P = undefined> = P extends undefined ? () => Promise<T> : (props: P) => Promise<T>;

type UseAsyncReturn<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refetch: () => void;
};

export type ApiOptions<T> = {
  enabled?: boolean;
  staleTimeout?: number;
  onSuccess?(data: T): void;
  onError?(error: unknown): void;
  onBeforeFetch?(): void;
};

type Props<T, P> = ApiOptions<T> & {
  queryFn: AsyncFn<T, P>;
  queryProps?: P;
};

const apiCache = {};

export function useAPI<T, P extends Record<PropertyKey, unknown> | undefined>({
  queryFn,
  queryProps = {},
  enabled = true,
  staleTimeout = 60000,
  onSuccess,
  onError,
  onBeforeFetch,
}: Props<T, P>): UseAsyncReturn<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  const cacheKey = queryFn.name + JSON.stringify(queryProps);

  const fetch = async () => {
    // do any cleanup on the application side before fetching.
    onBeforeFetch?.();

    setIsLoading(true);
    setData(undefined);
    setError(undefined);

    try {
      const res = await queryFn({ ...queryProps });
      setData(res);
      setIsLoading(false);
      apiCache[cacheKey] = { data: res, timestamp: new Date().getTime() };
      onSuccess?.(res);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e);
        onError?.(e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const execute = useCallback(() => {
    if (enabled) {
      const cachedItem = apiCache[cacheKey];
      if (cachedItem && new Date().getTime() - cachedItem.timestamp < staleTimeout) {
        // The cached item is still fresh, so we use it
        setData(cachedItem.data);
        onSuccess?.(cachedItem.data);
        setIsLoading(false);
      } else {
        // The cached item is stale or doesn't exist, so we fetch fresh data
        fetch();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, staleTimeout, enabled]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, isLoading, error, refetch: execute };
}
