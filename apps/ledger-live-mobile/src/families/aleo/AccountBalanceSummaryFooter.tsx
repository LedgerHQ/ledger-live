import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import BigNumber from "bignumber.js";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "~/context/Locale";
import { TFunction } from "i18next";
import { ScrollView } from "react-native";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import type { ModalInfo } from "~/modals/Info";
import InfoModal from "~/modals/Info";

type Props = {
  readonly account: AleoAccount;
};
type InfoName = "transparent" | "private";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName>();
  const info = useMemo(() => getInfo(t), [t]);
  const unit = useAccountUnit(account);

  const { aleoResources } = account;
  const transparentBalance = aleoResources?.transparentBalance ?? BigNumber(0);
  const privateBalance = aleoResources?.privateBalance ?? null;

  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);
  const onPressInfoCreator = useCallback(
    (name: InfoName) => () => setInfoName(name),
    [],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ paddingHorizontal: 16 }}
    >
      <InfoModal
        isOpened={!!infoName}
        onClose={onCloseModal}
        data={infoName ? info[infoName] : []}
      />
      <InfoItem
        title={t("aleo.info.transparent.title")}
        onPress={onPressInfoCreator("transparent")}
        value={<CurrencyUnitValue unit={unit} value={transparentBalance} disableRounding />}
      />
      <InfoItem
        isLast
        title={t("aleo.info.private.title")}
        onPress={onPressInfoCreator("private")}
        value={
          privateBalance !== null ? (
            <CurrencyUnitValue unit={unit} value={privateBalance} disableRounding />
          ) : (
            "***"
          )
        }
      />
    </ScrollView>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (!account.aleoResources || account.balance.lte(0)) return null;
  return <AccountBalanceSummaryFooter account={account} />;
}

function getInfo(t: TFunction<"translation">): Record<InfoName, ModalInfo[]> {
  const currency = getCryptoCurrencyById("aleo");
  return {
    transparent: [
      {
        Icon: () => <CryptoIcon ledgerId={currency.id} ticker={currency.ticker} size={20} />,
        title: t("aleo.info.transparent.title"),
        description: t("aleo.info.transparent.description"),
      },
    ],
    private: [
      {
        title: t("aleo.info.private.title"),
        description: t("aleo.info.private.description"),
      },
    ],
  };
}
