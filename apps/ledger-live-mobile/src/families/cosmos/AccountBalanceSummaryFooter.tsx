import React, { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/reactNative";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { Account } from "@ledgerhq/types-live";
import cryptoFactory from "@ledgerhq/live-common/families/cosmos/chain/chain";
import invariant from "invariant";
import InfoModal from "../../modals/Info";
import type { ModalInfo } from "../../modals/Info";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import InfoItem from "../../components/BalanceSummaryInfoItem";

type Props = {
  account: CosmosAccount;
};
type InfoName = "available" | "delegated" | "undelegating";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();
  const info = useInfo(account);
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

  return delegatedBalance.gt(0) || unbondingBalance.gt(0) ? (
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
  ) : null;
}

export default function AccountBalanceFooter({ account }: Props) {
  if (!account.cosmosResources || account.balance.lte(0)) return null;
  return <AccountBalanceSummaryFooter account={account} />;
}

function useInfo(account: Account): Record<InfoName, ModalInfo[]> {
  const { t } = useTranslation();
  const CosmosIcon = getCryptoCurrencyIcon(account.currency);
  const crypto = cryptoFactory(account.currency.id);
  invariant(CosmosIcon, "Icon is expected");
  return {
    available: [
      {
        Icon: () => <CosmosIcon color={account.currency.color} size={18} />,
        title: t("cosmos.info.available.title", {
          currencyTicker: account.currency.ticker,
        }),
        description: t("cosmos.info.available.description"),
      },
    ],
    delegated: [
      {
        title: t("cosmos.info.delegated.title"),
        description: t("cosmos.info.delegated.description", {
          currencyName: account.currency.name,
        }),
      },
    ],
    undelegating: [
      {
        title: t("cosmos.info.undelegating.title"),
        description: t("cosmos.info.undelegating.description", {
          numberOfDays: crypto.unbondingPeriod,
        }),
      },
    ],
  };
}
