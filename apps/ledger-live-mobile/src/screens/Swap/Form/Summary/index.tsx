import React, { useMemo } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
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
  swapTx: {
    swap: { from, to },
    status,
  },
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

  const fromUnit = useMemo(() => from.account && getAccountUnit(from.account), [
    from.account,
  ]);

  const rate = useMemo(() => "", []);

  const targetAccountName = useMemo(
    () => to.account && getAccountName(to.account),
    [to.account],
  );

  const fees = useMemo(() => status?.estimatedFees ?? "", [status]);

  if (
    !provider ||
    !fromUnit ||
    !to.currency ||
    !targetAccountName ||
    !fees ||
    !ProviderIcon ||
    !exchangeRate
  ) {
    return null;
  }

  return (
    <Flex>
      {}
      <Item
        title={t("transfer.swap2.form.details.label.provider")}
        onEdit={() => navigation.navigate("SelectProvider")}
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
        <Text>
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
          {rate}
        </Text>
      </Item>

      <Item
        title={t("transfer.swap2.form.details.label.fees")}
        onEdit={() => navigation.navigate("SelectFees")}
      >
        <Text>
          <CurrencyUnitValue unit={fromUnit} value={fees} />
        </Text>
      </Item>

      <Item
        title={t("transfer.swap2.form.details.label.target")}
        onEdit={() => navigation.navigate("SelectAccount", { target: "to" })}
      >
        <Text>{targetAccountName}</Text>
      </Item>
    </Flex>
  );
}
