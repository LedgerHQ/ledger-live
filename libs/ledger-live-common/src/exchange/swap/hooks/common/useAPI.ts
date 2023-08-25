import { useState, useEffect, useCallback } from "react";

type AsyncFn<T, P = undefined> = P extends undefined ? () => Promise<T> : (props: P) => Promise<T>;

type UseAsyncReturn<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refetch: () => void;
};

type ApiOptions = {
  enabled?: boolean;
  staleTimeout?: number;
};

type Props<T, P> = ApiOptions & {
  queryFn: AsyncFn<T, P>;
  queryProps?: P;
};

const cache = {};

export function useAPI<T, P extends Record<PropertyKey, unknown> | undefined>({
  queryFn,
  queryProps = {},
  enabled = true,
  staleTimeout = 5000,
}: Props<T, P>): UseAsyncReturn<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  const cacheKey = queryFn.name + JSON.stringify(queryProps);

  const fetch = async () => {
    setIsLoading(true);
    setData(undefined);
    setError(undefined);

    try {
      const res = await queryFn({ ...queryProps });
      setData(res);
      setIsLoading(false);
      cache[cacheKey] = { data: res, timestamp: new Date().getTime() };
    } catch (e: unknown) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const execute = useCallback(() => {
    if (enabled) {
      const cachedItem = cache[cacheKey];
      if (cachedItem && new Date().getTime() - cachedItem.timestamp < staleTimeout) {
        // The cached item is still fresh, so we use it
        setData(cachedItem.data);
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
