import React, { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/reactNative";
import type { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import InfoModal from "../../modals/Info";
import type { ModalInfo } from "../../modals/Info";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import InfoItem from "../../components/BalanceSummaryInfoItem";

type Props = {
  account: Account;
};
type InfoName = "available" | "delegated" | "undelegating";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();
  const info = useInfo();
  const { spendableBalance, cosmosResources } = account;
  const { delegatedBalance, unbondingBalance } = cosmosResources || {};
  const unit = getAccountUnit(account);
  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);
  const onPressInfoCreator = useCallback(
    (infoName: InfoName) => () => setInfoName(infoName),
    [],
  );

  return (
    (delegatedBalance.gt(0) || unbondingBalance.gt(0)) && (
      <>
        <InfoModal
          isOpened={!!infoName}
          onClose={onCloseModal}
          data={infoName ? info[infoName] : []}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[
            {
              paddingHorizontal: 16,
            },
          ]}
        >
          <InfoItem
            title={t("account.availableBalance")}
            onPress={onPressInfoCreator("available")}
            value={
              <CurrencyUnitValue
                unit={unit}
                value={spendableBalance}
                disableRounding
              />
            }
            isLast={!delegatedBalance.gt(0) && !unbondingBalance.gt(0)}
          />
          {delegatedBalance.gt(0) && (
            <InfoItem
              title={t("account.delegatedAssets")}
              onPress={onPressInfoCreator("delegated")}
              value={
                <CurrencyUnitValue
                  unit={unit}
                  value={delegatedBalance}
                  disableRounding
                />
              }
              isLast={!unbondingBalance.gt(0)}
            />
          )}
          {unbondingBalance.gt(0) && (
            <InfoItem
              title={t("account.undelegating")}
              onPress={onPressInfoCreator("undelegating")}
              value={
                <CurrencyUnitValue
                  unit={unit}
                  value={unbondingBalance}
                  disableRounding
                />
              }
              isLast={true}
            />
          )}
        </ScrollView>
      </>
    )
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (!account.cosmosResources || account.balance.lte(0)) return null;
  return <AccountBalanceSummaryFooter account={account} />;
}

function useInfo(): Record<InfoName, ModalInfo[]> {
  const { t } = useTranslation();
  const currency = getCryptoCurrencyById("cosmos");
  const CosmosIcon = getCryptoCurrencyIcon(currency);
  invariant(CosmosIcon, "Icon is expected");
  return {
    available: [
      {
        Icon: () => <CosmosIcon color={currency.color} size={18} />,
        title: t("cosmos.info.available.title"),
        description: t("cosmos.info.available.description"),
      },
    ],
    delegated: [
      {
        title: t("cosmos.info.delegated.title"),
        description: t("cosmos.info.delegated.description"),
      },
    ],
    undelegating: [
      {
        title: t("cosmos.info.undelegating.title"),
        description: t("cosmos.info.undelegating.description"),
      },
    ],
  };
}
