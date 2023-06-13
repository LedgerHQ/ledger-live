import { ParamListBase } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useEffect, useState } from "react";
import { BehaviorSubject } from "rxjs";

export type BehaviorSubjectType<T = unknown> = ((..._: T[]) => void) | undefined;

export const lockSubject = new BehaviorSubject<boolean>(false);
export const exposedManagerNavLockCallback = new BehaviorSubject<
  BehaviorSubjectType<{
    type: string;
    payload?: object;
    source?: string;
    target?: string;
  }>
>(undefined);

export function useManagerNavLockCallback() {
  const [callback, setCallback] = useState<BehaviorSubjectType>();

  useEffect(() => {
    const subscription = exposedManagerNavLockCallback.subscribe(cb => {
      setCallback(() => cb);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return callback;
}

export function useIsNavLocked(): boolean {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const subscription = lockSubject.subscribe(val => {
      setIsLocked(val);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return isLocked;
}

/** use Effect to trigger lock navigation updates and callback to retrieve catched navigation actions */
export const useLockNavigation = (
  when: boolean,
  callback: (action: {
    type: string;
    payload?: object;
    source?: string;
    target?: string;
  }) => void = () => {
    /* ignore */
  },
  navigation: StackNavigationProp<ParamListBase>,
) => {
  useEffect(() => {
    exposedManagerNavLockCallback.next(when ? callback : undefined);
    lockSubject.next(when);
    const listenerCleanup = navigation.addListener("beforeRemove", e => {
      if (!when) {
        // If we don't have unsaved changes, then we don't need to do anything
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      callback(e.data.action);
    });

    return () => {
      lockSubject.next(false);
      exposedManagerNavLockCallback.next(undefined);
      listenerCleanup();
    };
  }, [callback, navigation, when]);
};
