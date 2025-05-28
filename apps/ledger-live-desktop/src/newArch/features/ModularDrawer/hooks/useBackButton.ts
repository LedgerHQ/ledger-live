import { useMemo, useEffect, useState } from "react";
import { ModularDrawerStep } from "../types";

export function useBackButton({
  isASingleAsset,
  currentStep,
  hasOnlyOneNetwork,
  selectedAsset,
  selectedNetwork,
}: {
  isASingleAsset: boolean;
  currentStep: ModularDrawerStep;
  hasOnlyOneNetwork: boolean;
  selectedAsset?: unknown;
  selectedNetwork?: unknown;
}) {
  const showBackButton = useMemo(() => {
    if (isASingleAsset) return false;
    if (currentStep === "NETWORK_SELECTION") return !isASingleAsset;
    if (currentStep === "ACCOUNT_SELECTION") {
      return !isASingleAsset || !hasOnlyOneNetwork || (selectedAsset && selectedNetwork);
    }
    return false;
  }, [currentStep, isASingleAsset, hasOnlyOneNetwork, selectedAsset, selectedNetwork]);

  const [backButtonDisabled, setBackButtonDisabled] = useState(!showBackButton);
  useEffect(() => {
    setBackButtonDisabled(!showBackButton);
  }, [showBackButton]);

  return { backButtonDisabled };
}
