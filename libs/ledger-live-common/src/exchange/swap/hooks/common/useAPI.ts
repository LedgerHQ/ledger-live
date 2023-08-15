import { useState, useEffect, useCallback } from "react";

type AsyncFn<T, P = undefined> = P extends undefined ? () => Promise<T> : (props: P) => Promise<T>;

type UseAsyncReturn<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

type ApiOptions = {
  enabled?: boolean;
};

type Props<T, P> = ApiOptions & {
  queryFn: AsyncFn<T, P>;
  queryProps?: P;
};

export function useAPI<T, P extends Record<PropertyKey, unknown> | undefined>({
  queryFn,
  queryProps = {},
  enabled = true,
}: Props<T, P>): UseAsyncReturn<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fn = useCallback(() => {
    return queryFn({
      ...queryProps,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(queryProps)]);

  const execute = useCallback(() => {
    setIsLoading(true);
    setData(null);
    setError(null);
    return fn()
      .then((response: T) => {
        setData(response);
        setIsLoading(false);
      })
      .catch((error: Error) => {
        setError(error);
        setIsLoading(false);
      });
  }, [fn]);

  useEffect(() => {
    if (enabled) {
      execute();
    }
  }, [execute, enabled]);

  return { data, isLoading, error, refetch: execute };
}
