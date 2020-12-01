// @flow
import React, { useEffect, useState } from "react";
import {
  useNavigationBuilder,
  createNavigatorFactory,
  TabRouter,
} from "@react-navigation/native";
import { BottomTabView } from "@react-navigation/bottom-tabs";
import { BehaviorSubject } from "rxjs";

export const lockSubject = new BehaviorSubject(false);
const actionSubject = new BehaviorSubject();

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
export const useLockNavigation = (when, callback = () => {}) => {
  useEffect(() => {
    let sub;
    lockSubject.next(when);
    if (when) {
      sub = actionSubject.subscribe(callback);
    } else {
      if (sub) sub.unsubscribe();
      actionSubject.next(null);
      callback(null);
    }
  }, [callback, when]);
};

const Router = options => {
  const router = TabRouter(options);

  return {
    ...router,
    getStateForAction(state, action, options) {
      const result = router.getStateForAction(state, action, options);

      /** if action is of type NAVIGATE, not forced and the navigation is locked we catch the action and return the current state without changes */
      if (
        !action.force &&
        lockSubject.getValue() &&
        result != null &&
        action.type === "NAVIGATE"
      ) {
        // we catch the action in order to programatically dispatch somewhere else in a confirmation modal per instance
        actionSubject.next(action);
        // Returning the current state means that the action has been handled, but we don't have a new state
        return state;
      }

      // make sure we unlock navigation and reset the catched action state
      lockSubject.next(false);
      actionSubject.next(null);
      return result;
    },
  };
};

function BottomTabNavigator({
  initialRouteName,
  backBehavior,
  children,
  screenOptions,
  ...rest
}: *) {
  const { state, descriptors, navigation } = useNavigationBuilder(Router, {
    initialRouteName,
    backBehavior,
    children,
    screenOptions,
  });

  return (
    <BottomTabView
      {...rest}
      state={state}
      navigation={navigation}
      descriptors={descriptors}
    />
  );
}

export default createNavigatorFactory(BottomTabNavigator)();
