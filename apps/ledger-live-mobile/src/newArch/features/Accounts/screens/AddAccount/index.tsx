import React from "react";
import useAddAccountViewModel from "./useAddAccountViewModel";
import QueuedDrawer from "~/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import SelectAddAccountMethod from "./components/SelectAddAccountMethod";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import ChooseSyncMethod from "LLM/features/WalletSync/screens/Synchronize/ChooseMethod";

type ViewProps = {
  isAddAccountDrawerVisible: boolean;
  doesNotHaveAccount?: boolean;
  currency?: CryptoCurrency | TokenCurrency | null;
  isWalletSyncDrawerVisible: boolean;
  onCloseAddAccountDrawer: () => void;
  reopenDrawer: () => void;
  onRequestToOpenWalletSyncDrawer: () => void;
  onCloseWalletSyncDrawer: () => void;
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
        <ChooseSyncMethod />
      </QueuedDrawer>
    </>
  );
}

const AddAccount = (props: AddAccountProps) => {
  return <View {...useAddAccountViewModel(props)} {...props} />;
};

export default AddAccount;
