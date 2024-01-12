import React from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { Flex, BannerCard } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { CexDepositEntryPointsLocationsMobile } from "@ledgerhq/types-live/lib/cexDeposit";
import { track } from "~/analytics";
import CoinbaseIcon from "~/icons/Coinbase";

type Props = {
  location: CexDepositEntryPointsLocationsMobile;
  source: string;
};
const DepositFromCoinbaseButton = ({ location, source }: Props) => {
  const { t } = useTranslation();
  const cexDepositEntryPointsMobile = useFeature("cexDepositEntryPointsMobile");

  const onPressDepositFromCex = () => {
    const path = cexDepositEntryPointsMobile?.params?.path;

    if (path) {
      Linking.canOpenURL(path).then(() => Linking.openURL(path));
      track("button_clicked", {
        button: "deposit from coinbase",
        page: source,
      });
    }
  };

  if (
    !cexDepositEntryPointsMobile?.enabled ||
    !cexDepositEntryPointsMobile?.params?.locations?.[location] ||
    !cexDepositEntryPointsMobile?.params?.path
  ) {
    return null;
  }

  return (
    <Flex mx={6} mb={3}>
      <BannerCard
        typeOfRightIcon="arrow"
        title={t("transfer.receive.selectNetwork.depositFromCexBannerTitle")}
        LeftElement={<CoinbaseIcon />}
        hideLeftElementContainer
        onPress={onPressDepositFromCex}
      />
    </Flex>
  );
};

export default DepositFromCoinbaseButton;
