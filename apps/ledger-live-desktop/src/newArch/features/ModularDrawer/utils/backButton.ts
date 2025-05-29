import { ModularDrawerStep } from "../types";

export const isBackButtonDisabled = ({
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
}) => {
  if (isASingleAsset) return true;
  if (currentStep === "NETWORK_SELECTION") return isASingleAsset;
  if (currentStep === "ACCOUNT_SELECTION") {
    return isASingleAsset && hasOnlyOneNetwork && !(selectedAsset && selectedNetwork);
  }
  return true;
};
