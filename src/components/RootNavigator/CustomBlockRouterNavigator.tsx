// @flow
import { useEffect, useState } from "react";
import { BehaviorSubject } from "rxjs";

export const lockSubject = new BehaviorSubject<boolean>(false);

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
  callback: (...args: any[]) => void = () => {},
  navigation: any,
) => {
  useEffect(() => {
    lockSubject.next(when);
    navigation.addListener("beforeRemove", (e: any) => {
      if (!when) {
        // If we don't have unsaved changes, then we don't need to do anything
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      callback(e.data.action);
    });

    return () => {
      navigation.removeListener("beforeRemove");
    };
  }, [callback, navigation, when]);
};
