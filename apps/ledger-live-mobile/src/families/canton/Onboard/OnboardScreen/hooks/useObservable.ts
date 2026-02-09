import { useCallback, useEffect, useRef } from "react";
import { Observable, Subscription } from "rxjs";

interface UseObservableCallbacks<T> {
  onNext: (value: T) => void;
  onError?: (error: Error) => void;
}

export function useObservable() {
  const subscriptionRef = useRef<Subscription | null>(null);

  const subscribe = useCallback(
    <T>(observable: Observable<T>, callbacks: UseObservableCallbacks<T>) => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }

      const subscription = observable.subscribe({
        next: value => {
          callbacks.onNext(value);
        },
        error: (error: Error) => {
          callbacks.onError?.(error);
        },
      });

      subscriptionRef.current = subscription;
    },
    [],
  );

  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return { subscribe, unsubscribe };
}
