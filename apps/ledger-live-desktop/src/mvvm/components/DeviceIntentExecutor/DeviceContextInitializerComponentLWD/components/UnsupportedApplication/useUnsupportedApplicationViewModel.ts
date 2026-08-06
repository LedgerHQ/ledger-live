import { useInitializerActions } from "../../hooks/useInitializerActions";

export function useUnsupportedApplicationViewModel() {
  const { openSupport } = useInitializerActions();

  return {
    onContactSupport: openSupport,
  };
}
