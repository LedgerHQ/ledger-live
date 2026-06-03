import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";

export type PopNavigationBack = Readonly<{
  showBackButton: boolean;
  navigateBack: () => void;
}>;

export function usePopNavigationBack(
  parseBackPath: (locationState: unknown) => string | undefined,
  onBack?: () => void,
): PopNavigationBack {
  const navigate = useNavigate();
  const location = useLocation();

  const showBackButton = useMemo(
    () => parseBackPath(location.state) !== undefined,
    [location.state, parseBackPath],
  );

  const navigateBack = useCallback(() => {
    onBack?.();
    // Pop the history stack; do not navigate(backPath) — that pushes a duplicate entry.
    navigate(-1);
  }, [navigate, onBack]);

  return { showBackButton, navigateBack };
}
