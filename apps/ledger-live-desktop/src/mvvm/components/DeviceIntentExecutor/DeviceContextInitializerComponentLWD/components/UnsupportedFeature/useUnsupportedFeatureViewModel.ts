import { useInitializerActions } from "../../hooks/useInitializerActions";

export function useUnsupportedFeatureViewModel() {
  const { openSupport } = useInitializerActions();

  return {
    onContactSupport: openSupport,
  };
}
