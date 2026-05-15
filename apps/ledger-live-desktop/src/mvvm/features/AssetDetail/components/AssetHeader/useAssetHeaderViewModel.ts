import { useCallback } from "react";
import { useNavigate } from "react-router";

export type AssetHeaderViewModel = Readonly<{
  onBack: () => void;
}>;

export function useAssetHeaderViewModel(): AssetHeaderViewModel {
  const navigate = useNavigate();

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return { onBack };
}
