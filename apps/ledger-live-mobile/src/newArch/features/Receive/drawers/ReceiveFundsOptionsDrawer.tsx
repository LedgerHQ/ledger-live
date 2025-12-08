import React from "react";
import { Text } from "@ledgerhq/native-ui";
import { Icons } from "@ledgerhq/native-ui/index";
import { TrackScreen } from "~/analytics";
import { OptionButton } from "../components/OptionButton";
import QueuedDrawerGorhom from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import useReceiveFundsOptionsViewModel from "./useReceiveFundsOptionsViewModel";
import { TFunction } from "i18next";

type ViewProps = Readonly<{
  isOpen: boolean;
  t: TFunction;
  handleGoToFiat: () => void;
  handleGoToCrypto: () => void;
  handleClose: () => void;
}>;

function View({ isOpen, t, handleGoToFiat, handleGoToCrypto, handleClose }: ViewProps) {
  return (
    <QueuedDrawerGorhom
      isRequestingToBeOpened={isOpen}
      snapPoints={["35%", "55%"]}
      onClose={handleClose}
    >
      <TrackScreen category="receive_drawer" type="drawer" />
      <Text textAlign="center" fontSize={24} mb={5}>
        {t("transfer.receive.title")}
      </Text>
      <OptionButton
        onPress={handleGoToFiat}
        title={t("transfer.receive.menu.fiat.title")}
        subtitle={t("transfer.receive.menu.fiat.description")}
        Icon={Icons.Bank}
        testID="option-button-content-fiat"
      />
      <OptionButton
        onPress={handleGoToCrypto}
        title={t("transfer.receive.menu.crypto.title")}
        subtitle={t("transfer.receive.menu.crypto.description")}
        testID="option-button-content-crypto"
        Icon={Icons.CoinsCrypto}
      />
    </QueuedDrawerGorhom>
  );
}

const ReceiveFundsOptions = () => <View {...useReceiveFundsOptionsViewModel()} />;

export default ReceiveFundsOptions;
