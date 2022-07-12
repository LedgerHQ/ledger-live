import { useNavigationState } from "@react-navigation/native";

function usePreviousRouteName() {
  return useNavigationState(state => state.routes[state.index - 1]?.name);
}

function useCurrentRouteName() {
  return useNavigationState(state => state.routes[state.index]?.name);
}

export { usePreviousRouteName, useCurrentRouteName };
