import React from "react";
import useAddAccountViewModel from "./useAddAccountViewModel";
import QueuedDrawer from "~/components/QueuedDrawer";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import DrawerHeader from "LLM/features/WalletSync/components/Synchronize/DrawerHeader";
import { Flex } from "@ledgerhq/native-ui";
import { useWindowDimensions } from "react-native";
import StepFlow from "./components/StepFlow";
import { Steps } from "../../types/enum/addAccount";

type ViewProps = ReturnType<typeof useAddAccountViewModel> & AddAccountProps;

type AddAccountProps = {
  isOpened: boolean;
  currency?: CryptoCurrency | TokenCurrency | null;
  doesNotHaveAccount?: boolean;
  onClose: () => void;
  reopenDrawer: () => void;
};

const StartingStep = Steps.AddAccountMethod;

function View({
  isAddAccountDrawerVisible,
  doesNotHaveAccount,
  currency,
  onCloseAddAccountDrawer,
}: ViewProps) {
  const [currentStep, setCurrentStep] = React.useState<Steps>(StartingStep);
  const { height } = useWindowDimensions();
  const maxDrawerHeight = height - 180;

  const CustomDrawerHeader = () => <DrawerHeader onClose={onCloseAddAccountDrawer} />;

  const handleStepChange = (step: Steps) => setCurrentStep(step);

  let goBackCallback: () => void;

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isAddAccountDrawerVisible}
      onClose={onCloseAddAccountDrawer}
      CustomHeader={currentStep === Steps.QrCodeMethod ? CustomDrawerHeader : undefined}
      hasBackButton={currentStep === Steps.ChooseSyncMethod}
      onBack={() => goBackCallback()}
    >
      <Flex maxHeight={maxDrawerHeight}>
        <StepFlow
          startingStep={StartingStep}
          doesNotHaveAccount={doesNotHaveAccount}
          currency={currency}
          onStepChange={handleStepChange}
          onGoBack={callback => (goBackCallback = callback)}
        />
      </Flex>
    </QueuedDrawer>
  );
}

const AddAccount = (props: AddAccountProps) => {
  return <View {...useAddAccountViewModel(props)} {...props} />;
};

export default AddAccount;
