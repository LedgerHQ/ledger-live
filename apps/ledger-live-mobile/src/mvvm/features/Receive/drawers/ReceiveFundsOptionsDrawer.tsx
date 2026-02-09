import React from "react";
import { Text } from "@ledgerhq/native-ui";
import { Icons } from "@ledgerhq/native-ui/index";
import { BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { TrackScreen } from "~/analytics";
import { OptionButton } from "../components/OptionButton";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
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
  const { isEnabled } = useWalletFeaturesConfig("mobile");

  const content = (
    <>
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
    </>
  );

  if (isEnabled) {
    return (
      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={isOpen}
        snapPoints={["35%", "55%"]}
        onClose={handleClose}
      >
        <BottomSheetHeader />
        {content}
      </QueuedDrawerBottomSheet>
    );
  }

  return (
    <QueuedDrawerGorhom
      isRequestingToBeOpened={isOpen}
      snapPoints={["35%", "55%"]}
      onClose={handleClose}
    >
      {content}
    </QueuedDrawerGorhom>
  );
}

const ReceiveFundsOptions = () => <View {...useReceiveFundsOptionsViewModel()} />;

export default ReceiveFundsOptions;
