import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { MinaAccount } from "@ledgerhq/live-common/families/mina/types";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/reactNative";
import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { ScrollView } from "react-native";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import type { ModalInfo } from "~/modals/Info";
import InfoModal from "~/modals/Info";

type Props = Readonly<{
  account: MinaAccount;
}>;
type InfoName = "delegatedTo" | "stakedBalance" | "producerAddress";

function getInfo(t: TFunction<"translation">): Record<InfoName, ModalInfo[]> {
  const currency = getCryptoCurrencyById("mina");
  const MinaIcon = getCryptoCurrencyIcon(currency);
  invariant(MinaIcon, "Icon is expected");
  return {
    delegatedTo: [
      {
        Icon: () => <MinaIcon color={currency.color} size={18} />,
        title: t("mina.summaryFooter.delegatedTo"),
        description: t("mina.summaryFooter.delegatedToTooltip"),
      },
    ],
    stakedBalance: [
      {
        title: t("mina.summaryFooter.stakedBalance"),
        description: t("mina.summaryFooter.stakedBalanceTooltip"),
      },
    ],
    producerAddress: [
      {
        title: t("mina.summaryFooter.producerAddress"),
        description: t("mina.summaryFooter.producerAddressTooltip"),
      },
    ],
  };
}

function AccountBalanceSummaryFooter({ account }: Props) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName>();
  const info = useMemo(() => getInfo(t), [t]);
  const unit = useAccountUnit(account);
  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);
  const onPressInfoCreator = useCallback((infoName: InfoName) => () => setInfoName(infoName), []);

  const hasDelegation = account.resources?.stakingActive;
  if (!hasDelegation) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[
        {
          paddingHorizontal: 16,
        },
      ]}
    >
      <InfoModal
        isOpened={!!infoName}
        onClose={onCloseModal}
        data={infoName ? info[infoName] : []}
      />
      <InfoItem
        title={t("mina.summaryFooter.delegatedTo")}
        onPress={onPressInfoCreator("delegatedTo")}
        value={account.resources?.delegateInfo?.identityName || ""}
      />
      <InfoItem
        title={t("mina.summaryFooter.stakedBalance")}
        onPress={onPressInfoCreator("stakedBalance")}
        value={<CurrencyUnitValue unit={unit} value={account.balance} disableRounding />}
      />
      <InfoItem
        title={t("mina.summaryFooter.producerAddress")}
        onPress={onPressInfoCreator("producerAddress")}
        value={account.resources?.delegateInfo?.address || ""}
      />
    </ScrollView>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (account.type !== "Account") return null;
  return <AccountBalanceSummaryFooter account={account} />;
}
