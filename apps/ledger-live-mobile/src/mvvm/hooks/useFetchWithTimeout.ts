import { useCallback } from "react";

const useFetchWithTimeout = (timeout: number = 3000) => {
  const fetchWithTimeout = useCallback(
    async <T>(fetchFunction: () => Promise<T>): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("Fetch timed out"));
        }, timeout);

        fetchFunction()
          .then(result => {
            clearTimeout(timer);
            resolve(result);
          })
          .catch(error => {
            clearTimeout(timer);
            reject(error);
          });
      });
    },
    [timeout],
  );

  return fetchWithTimeout;
};

export default useFetchWithTimeout;
