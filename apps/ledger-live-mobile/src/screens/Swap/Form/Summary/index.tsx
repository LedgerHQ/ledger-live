import React, { useCallback, useMemo } from "react";
import { Flex, Icon, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { getProviderName } from "@ledgerhq/live-common/lib/exchange/swap/utils";
import {
  SwapTransactionType,
  ExchangeRate,
  KYCStatus,
} from "@ledgerhq/live-common/lib/exchange/swap/types";
import {
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import { useNavigation } from "@react-navigation/native";
import CurrencyUnitValue from "../../../../components/CurrencyUnitValue";
// eslint-disable-next-line import/no-unresolved, import/named
import { providerIcons } from "../../../../icons/swap";
import { StatusTag } from "./StatusTag";
import { Item } from "./Item";

interface Props {
  provider?: string;
  swapTx: SwapTransactionType;
  exchangeRate?: ExchangeRate;
  kyc?: KYCStatus;
}

export function Summary({
  provider,
  swapTx: { swap, status, transaction },
  exchangeRate,
  kyc,
}: Props) {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const name = useMemo(() => provider && getProviderName(provider), [provider]);

  const ProviderIcon = useMemo(
    () => provider && providerIcons[provider.toLowerCase()],
    [provider],
  );

  const { from, to } = swap;

  const fromUnit = useMemo(() => from.account && getAccountUnit(from.account), [
    from.account,
  ]);

  const targetAccountName = useMemo(
    () => to.account && getAccountName(to.account),
    [to.account],
  );

  const fees = useMemo(() => status?.estimatedFees ?? "", [status]);

  const onEditProvider = useCallback(() => {
    navigation.navigate("SelectProvider", {
      swap,
      provider,
      selectedId: exchangeRate?.rateId,
    });
  }, [navigation, swap, provider, exchangeRate]);

  if (
    !provider ||
    !fromUnit ||
    !to.currency ||
    !fees ||
    !ProviderIcon ||
    !exchangeRate
  ) {
    return null;
  }

  return (
    <Flex>
      <Item
        title={t("transfer.swap2.form.details.label.provider")}
        onEdit={onEditProvider}
      >
        <Flex flexDirection="row" alignItems="center">
          <StatusTag kyc={kyc} />
          <Flex paddingRight={2}>
            <ProviderIcon size={14} />
          </Flex>

          <Text>{name}</Text>
        </Flex>
      </Item>

      <Item title={t("transfer.swap2.form.details.label.rate")}>
        <Icon
          name={exchangeRate.tradeMethod === "fixed" ? "Lock" : "Unlock"}
          color="neutral.c70"
        />
        <Text marginLeft={2}>
          <CurrencyUnitValue
            value={new BigNumber(10).pow(fromUnit.magnitude)}
            unit={fromUnit}
            showCode
          />
          {" = "}
          <CurrencyUnitValue
            unit={to.currency.units[0]}
            value={new BigNumber(10)
              .pow(fromUnit.magnitude)
              .times(exchangeRate.magnitudeAwareRate)}
            showCode
          />
        </Text>
      </Item>

      <Item
        title={t("transfer.swap2.form.details.label.fees")}
        onEdit={() => navigation.navigate("SelectFees", { transaction, swap })}
      >
        <Text>
          <CurrencyUnitValue unit={fromUnit} value={fees} />
        </Text>
      </Item>

      <Item
        title={t("transfer.swap2.form.details.label.target")}
        onEdit={() =>
          navigation.navigate("SelectAccount", { target: "to", accountIds: [] })
        }
      >
        <Text>{targetAccountName}</Text>
      </Item>
    </Flex>
  );
}
