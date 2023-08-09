import { useState, useEffect, useCallback } from "react";

type AsyncFn<T> = () => Promise<T>;

type UseAsyncReturn<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
};

export function useAPI<T>(asyncFunction: AsyncFn<T>, immediate: boolean = true): UseAsyncReturn<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(() => {
    setIsLoading(true);
    setData(null);
    setError(null);
    return asyncFunction()
      .then((response: T) => {
        setData(response);
        setIsLoading(false);
      })
      .catch((error: Error) => {
        setError(error);
        setIsLoading(false);
      });
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, isLoading, error, execute };
}
