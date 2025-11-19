import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { NavigationState, PartialState } from "@react-navigation/native";
import { navigationRef } from "~/rootnavigation";
import { setIsAppLoaded } from "../actions";

function getFocusedRouteName(
  state: NavigationState | PartialState<NavigationState> | undefined,
): string | undefined {
  if (!state || typeof state.index !== "number") {
    return undefined;
  }

  const nestedState = state.routes[state.index]?.state;
  if (nestedState && "index" in nestedState) {
    return getFocusedRouteName(nestedState);
  }

  return state.routes[state.index]?.name;
}

export function useAutoDismissSplashScreen(isNavigationReady: boolean) {
  const dispatch = useDispatch();
  const hasDismissedRef = useRef(false);

  useEffect(() => {
    if (!isNavigationReady) return;

    const navigation = navigationRef.current;
    if (!navigation) return;

    const unsubscribe = navigation.addListener("state", e => {
      if (hasDismissedRef.current) return;

      const state = e.data.state;
      const routeName = getFocusedRouteName(state);

      if (routeName) {
        hasDismissedRef.current = true;
        dispatch(setIsAppLoaded(true));
      }
    });

    return unsubscribe;
  }, [dispatch, isNavigationReady]);
}
