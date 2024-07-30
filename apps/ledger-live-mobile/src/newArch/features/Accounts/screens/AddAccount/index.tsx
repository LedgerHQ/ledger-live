import React from "react";
import useAddAccountViewModel from "./useAddAccountViewModel";
import QueuedDrawer from "~/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import SelectAddAccountMethod from "./components/SelectAddAccountMethod";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import ChooseSyncMethod from "LLM/features/WalletSync/screens/Synchronize/ChooseMethod";
import QrCodeMethod from "LLM/features/WalletSync/screens/Synchronize/QrCodeMethod";
import DrawerHeader from "LLM/features/WalletSync/components/Synchronize/DrawerHeader";
import { Flex } from "@ledgerhq/native-ui";
import { useWindowDimensions } from "react-native";

type ViewProps = {
  isAddAccountDrawerVisible: boolean;
  doesNotHaveAccount?: boolean;
  currency?: CryptoCurrency | TokenCurrency | null;
  isWalletSyncDrawerVisible: boolean;
  onCloseAddAccountDrawer: () => void;
  reopenDrawer: () => void;
  onRequestToOpenWalletSyncDrawer: () => void;
  onCloseWalletSyncDrawer: (reopenPrevious?: boolean) => void;
};

type AddAccountProps = {
  isOpened: boolean;
  currency?: CryptoCurrency | TokenCurrency | null;
  doesNotHaveAccount?: boolean;
  onClose: () => void;
  reopenDrawer: () => void;
};

function View({
  isAddAccountDrawerVisible,
  doesNotHaveAccount,
  currency,
  isWalletSyncDrawerVisible,
  onCloseAddAccountDrawer,
  onRequestToOpenWalletSyncDrawer,
  onCloseWalletSyncDrawer,
}: ViewProps) {
  const [isQrCodeDrawerOpen, setIsQrCodeDrawerOpen] = React.useState(false);
  const { height } = useWindowDimensions();
  const maxDrawerHeight = height - 180;

  const onScanMethodPress = () => {
    onCloseWalletSyncDrawer(false);
    setIsQrCodeDrawerOpen(true);
  };

  const onCloseQrCodeDrawer = () => {
    setIsQrCodeDrawerOpen(false);
    onRequestToOpenWalletSyncDrawer();
  };

  const CustomDrawerHeader = () => {
    return <DrawerHeader onClose={onCloseQrCodeDrawer} />;
  };

  return (
    <>
      <QueuedDrawer
        isRequestingToBeOpened={isAddAccountDrawerVisible}
        onClose={onCloseAddAccountDrawer}
      >
        <TrackScreen category="Add/Import accounts" type="drawer" />
        <SelectAddAccountMethod
          doesNotHaveAccount={doesNotHaveAccount}
          currency={currency}
          onClose={onCloseAddAccountDrawer}
          setWalletSyncDrawerVisible={onRequestToOpenWalletSyncDrawer}
        />
      </QueuedDrawer>
      <QueuedDrawer
        isRequestingToBeOpened={isWalletSyncDrawerVisible}
        onClose={onCloseWalletSyncDrawer}
      >
        <ChooseSyncMethod onScanMethodPress={onScanMethodPress} />
      </QueuedDrawer>

      <QueuedDrawer
        isRequestingToBeOpened={isQrCodeDrawerOpen}
        onClose={onCloseQrCodeDrawer}
        CustomHeader={CustomDrawerHeader}
      >
        <Flex maxHeight={maxDrawerHeight}>
          <QrCodeMethod />
        </Flex>
      </QueuedDrawer>
    </>
  );
}

const AddAccount = (props: AddAccountProps) => {
  return <View {...useAddAccountViewModel(props)} {...props} />;
};

export default AddAccount;
