import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { SuiAccount } from "@ledgerhq/live-common/families/sui/types";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import BigNumber from "bignumber.js";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { ScrollView } from "react-native";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import type { ModalInfo } from "~/modals/Info";
import InfoModal from "~/modals/Info";

type Props = {
  readonly account: SuiAccount;
};
type InfoName = "available" | "staked";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName>();
  const info = useMemo(() => getInfo(t), [t]);
  const unit = useAccountUnit(account);

  const { spendableBalance: _spendableBalance, suiResources } = account;
  const stakes = suiResources?.stakes ?? [];
  const _stakedBalance = stakes
    .flatMap(s => s.stakes)
    .reduce((acc, stake) => acc.plus(BigNumber(stake.principal)), BigNumber(0));

  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);
  const onPressInfoCreator = useCallback((infoName: InfoName) => () => setInfoName(infoName), []);

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
        title={t("account.availableBalance")}
        onPress={onPressInfoCreator("available")}
        value={<CurrencyUnitValue unit={unit} value={_spendableBalance} disableRounding />}
      />

      {_stakedBalance.gt(0) && (
        <InfoItem
          title={t("sui.info.staked.title")}
          onPress={onPressInfoCreator("staked")}
          value={<CurrencyUnitValue unit={unit} value={_stakedBalance} disableRounding />}
        />
      )}
    </ScrollView>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (!account.suiResources || account.balance.lte(0)) return null;
  return <AccountBalanceSummaryFooter account={account} />;
}

function getInfo(t: TFunction<"translation">): Record<InfoName, ModalInfo[]> {
  const currency = getCryptoCurrencyById("sui");
  return {
    available: [
      {
        Icon: () => <CryptoIcon ledgerId={currency.id} ticker={currency.ticker} size={20} />,
        title: t("sui.info.available.title"),
        description: t("sui.info.available.description"),
      },
    ],
    staked: [
      {
        title: t("sui.info.staked.title"),
        description: t("sui.info.staked.description"),
      },
    ],
  };
}
