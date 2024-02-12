import React, { useMemo, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { BigNumber } from "bignumber.js";
import { Flex, Text, Icon } from "@ledgerhq/native-ui";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { useTranslation } from "react-i18next";
import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import ProviderIcon from "~/components/ProviderIcon";
import { SelectProviderParamList } from "../types";
import CounterValue from "~/components/CounterValue";
import { TrackScreen, useAnalytics } from "~/analytics";
import { ScreenName } from "~/const";
import { sharedSwapTracking, SWAP_VERSION } from "../utils";

export function SelectProvider({ navigation, route }: SelectProviderParamList) {
  const {
    params: {
      provider,
      swap: { from, to, rates },
      selectedRate,
    },
  } = route;
  const { track } = useAnalytics();
  const { t } = useTranslation();
  const fromUnit = useMemo(() => from.account && getAccountUnit(from.account), [from.account]);

  const onSelect = useCallback(
    (rate: ExchangeRate) => {
      track("button_clicked", {
        ...sharedSwapTracking,
        button: "Partner Chosen",
        swapType: rate.tradeMethod,
        defaultPartner: selectedRate?.provider ?? "missing",
        totalPartners: rates.value?.length ?? "missing",
      });
      // @ts-expect-error navigation type is only partially declared
      navigation.navigate(ScreenName.SwapForm, {
        rate,
        merge: true,
      });
    },
    [track, selectedRate?.provider, rates.value?.length, navigation],
  );

  if (!rates.value || !fromUnit || !to.currency) {
    return null;
  }

  const toCurrency = to.currency;

  return (
    <Flex paddingX={4}>
      <TrackScreen
        category="Swap Form"
        name="Edit Provider"
        provider={provider}
        flow="swap"
        swapVersion={SWAP_VERSION}
        defaultPartner={selectedRate?.provider ?? "missing"}
        totalPartners={rates.value.length}
      />
      <Flex flexDirection="row" justifyContent="space-between" paddingY={2}>
        <Text margin={4} color="neutral.c70">
          {t("transfer.swap2.form.ratesDrawer.quote")}
        </Text>

        <Text padding={4} color="neutral.c70">
          {t("transfer.swap2.form.ratesDrawer.receive")}
        </Text>
      </Flex>

      <Flex>
        {rates.value.map(rate => {
          const isSelected = selectedRate === rate;

          return (
            <TouchableOpacity
              key={`${rate.provider}_${rate.tradeMethod}`}
              onPress={() => onSelect(rate)}
            >
              <Flex
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                padding={4}
                marginY={2}
                borderRadius={4}
                border={1}
                borderColor={isSelected ? "primary.c70" : "neutral.c30"}
              >
                <Flex flexDirection="row" alignItems="center">
                  <ProviderIcon size="XS" name={rate.provider} />
                  <Flex marginLeft={4}>
                    <Text variant="large" paddingBottom={2}>
                      {getProviderName(rate.provider)}
                    </Text>

                    <Flex flexDirection="row" alignItems="center">
                      <Icon
                        name={rate.tradeMethod === "fixed" ? "Lock" : "Unlock"}
                        color="neutral.c70"
                      />
                      <Text variant="tiny" color="neutral.c70" marginLeft={1}>
                        <CurrencyUnitValue
                          value={new BigNumber(10).pow(fromUnit.magnitude)}
                          unit={fromUnit}
                          showCode
                        />

                        {" = "}

                        <CurrencyUnitValue
                          unit={toCurrency.units[0]}
                          value={new BigNumber(10)
                            .pow(fromUnit.magnitude)
                            .times(rate.magnitudeAwareRate)}
                          showCode
                        />
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>

                <Flex alignItems="flex-end">
                  <Text variant="large" paddingBottom={2}>
                    <CurrencyUnitValue value={rate.toAmount} unit={toCurrency.units[0]} showCode />
                  </Text>

                  <Text variant="tiny" color="neutral.c70">
                    <CounterValue currency={toCurrency} value={rate.toAmount} />
                  </Text>
                </Flex>
              </Flex>
            </TouchableOpacity>
          );
        })}
      </Flex>
    </Flex>
  );
}
