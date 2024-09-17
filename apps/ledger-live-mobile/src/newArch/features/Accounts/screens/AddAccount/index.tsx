import React from "react";
import useAddAccountViewModel from "./useAddAccountViewModel";
import QueuedDrawer from "~/components/QueuedDrawer";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import DrawerHeader from "LLM/features/WalletSync/components/Synchronize/DrawerHeader";
import { Flex } from "@ledgerhq/native-ui";
import StepFlow from "./components/StepFlow";
import { Steps } from "LLM/features/WalletSync/types/Activation";
import { useCurrentStep } from "LLM/features/WalletSync/hooks/useCurrentStep";

type ViewProps = ReturnType<typeof useAddAccountViewModel> & AddAccountProps;

type AddAccountProps = {
  isOpened: boolean;
  currency?: CryptoCurrency | TokenCurrency | null;
  doesNotHaveAccount?: boolean;
  onClose: () => void;
};

function View({
  isAddAccountDrawerVisible,
  doesNotHaveAccount,
  currency,
  onCloseAddAccountDrawer,
  onGoBack,
  currentOption,
  setCurrentOption,
  navigateToChooseSyncMethod,
  navigateToQrCodeMethod,
  qrProcess,
  onQrCodeScanned,
  onCreateKey,
}: ViewProps) {
  const { currentStep } = useCurrentStep();
  const CustomDrawerHeader = () => <DrawerHeader onClose={onCloseAddAccountDrawer} />;

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isAddAccountDrawerVisible}
      onClose={onCloseAddAccountDrawer}
      CustomHeader={currentStep === Steps.QrCodeMethod ? CustomDrawerHeader : undefined}
      hasBackButton={currentStep === Steps.ChooseSyncMethod}
      onBack={onGoBack}
    >
      <Flex maxHeight={"90%"}>
        <StepFlow
          doesNotHaveAccount={doesNotHaveAccount}
          currency={currency}
          setCurrentOption={setCurrentOption}
          currentOption={currentOption}
          navigateToChooseSyncMethod={navigateToChooseSyncMethod}
          navigateToQrCodeMethod={navigateToQrCodeMethod}
          qrProcess={qrProcess}
          onQrCodeScanned={onQrCodeScanned}
          onCreateKey={onCreateKey}
        />
      </Flex>
    </QueuedDrawer>
  );
}

const AddAccount = (props: AddAccountProps) => {
  return <View {...useAddAccountViewModel(props)} {...props} />;
};

export default AddAccount;
