import { useNavigationState } from "@react-navigation/native";

function usePreviousRouteName() {
  return useNavigationState(state =>
    state.routes[state.index - 1]?.name
      ? state.routes[state.index - 1].name
      : undefined,
  );
}

function useCurrentRouteName() {
  return useNavigationState(state =>
    state.routes[state.index]?.name
      ? state.routes[state.index].name
      : undefined,
  );
}

export { usePreviousRouteName, useCurrentRouteName };
