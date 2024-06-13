import React, { useState } from "react";
import useAddAccountViewModel from "./useAddAccountViewModel";
import QueuedDrawer from "~/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import SelectAddAccountMethod from "./components/SelectAddAccountMethod";
import Drawer from "LLM/components/Dummy/Drawer";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

type ViewProps = {
  isAddAccountDrawerVisible: boolean;
  doesNotHaveAccount?: boolean;
  currency?: CryptoCurrency | TokenCurrency | null;
  onCloseAddAccountDrawer: () => void;
  reopenDrawer: () => void;
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
  onCloseAddAccountDrawer,
  reopenDrawer,
}: ViewProps) {
  const [isWalletSyncDrawerVisible, setWalletSyncDrawerVisible] = useState(false);

  const onRequestToOpenWalletSyncDrawer = () => {
    onCloseAddAccountDrawer();
    setWalletSyncDrawerVisible(true);
  };

  const onCloseWalletSyncDrawer = () => {
    setWalletSyncDrawerVisible(false);
    reopenDrawer();
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
      <Drawer isOpen={isWalletSyncDrawerVisible} handleClose={onCloseWalletSyncDrawer} />
    </>
  );
}

const AddAccount = (props: AddAccountProps) => {
  return <View {...useAddAccountViewModel(props)} {...props} />;
};

export default AddAccount;
