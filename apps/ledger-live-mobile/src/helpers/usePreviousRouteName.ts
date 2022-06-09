import { useNavigationState } from "@react-navigation/native";

function usePreviousRouteName() {
  return useNavigationState(state =>
    state.routes[state.index - 1]?.name
      ? state.routes[state.index - 1].name
      : undefined,
  );
}

export default usePreviousRouteName;
