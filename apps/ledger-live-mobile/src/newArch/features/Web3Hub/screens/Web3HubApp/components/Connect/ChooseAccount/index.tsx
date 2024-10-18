import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import SelectAccountModal from "../../Web3Player/SelectAccountModal";
import { TouchableOpacity } from "react-native";

type SelectAccountButtonProps = {
  manifest: AppManifest;
  currentAccountHistDb: CurrentAccountHistDB;
};

export default function ChooseAccountButton({
  manifest,
  currentAccountHistDb,
}: SelectAccountButtonProps) {
  const [modalOpened, setModalOpened] = useState(false);

  const onChooseAccount = useCallback(() => {
    setModalOpened(true);
  }, []);

  const onClose = useCallback(() => {
    setModalOpened(false);
  }, []);

  return (
    <>
      <SelectAccountModal
        manifest={manifest}
        currentAccountHistDb={currentAccountHistDb}
        isOpened={modalOpened}
        onSelectAccount={onChooseAccount}
        onClose={onClose}
      />

      <TouchableOpacity onPress={onChooseAccount}>
        <Text variant="body" color="primary.c80">
          <Trans i18nKey="web3hub.app.selectAccountModal.accountHeader.title" />
        </Text>
      </TouchableOpacity>
    </>
  );
}
