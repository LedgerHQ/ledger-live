import { getFeesUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  ExchangeRate,
  RatesReducerState,
  SwapSelectorStateType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { isRegistrationRequired } from "@ledgerhq/live-common/exchange/swap/utils/index";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { rateSelector, updateRateAction } from "~/renderer/actions/swap";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Tooltip from "~/renderer/components/Tooltip";
import IconInfoCircle from "~/renderer/icons/InfoCircle";
import { useGetSwapTrackingProperties } from "../../utils/index";
import Countdown from "./Countdown";
import { filterRates } from "./filterRates";
import LoadingState from "./LoadingState";
import NoQuoteSwapRate from "./NoQuoteSwapRate";
import SwapRate from "./SwapRate";

type Props = {
  fromCurrency: SwapSelectorStateType["currency"];
  toCurrency: SwapSelectorStateType["currency"];
  rates: RatesReducerState["value"];
  provider: string | undefined | null;
  countdownSecondsToRefresh: number | undefined;
};

const TableHeader = styled(Box).attrs({
  horizontal: true,
  alignItems: "center",
  ff: "Inter|SemiBold",
  justifyContent: "space-between",
  fontWeight: "500",
  fontSize: 3,
  color: "palette.text.shade40",
  pl: 3,
  pr: 2,
  mt: 3,
  pb: 10,
})`
  border-bottom: 1px solid ${p => p.theme.colors.neutral.c30};
`;

export default function ProviderRate({
  fromCurrency,
  toCurrency,
  rates,
  provider,
  countdownSecondsToRefresh,
}: Props) {
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const dispatch = useDispatch();
  const [filter] = useState<string[]>([]);
  const [defaultPartner, setDefaultPartner] = useState<string | null>(null);
  const [isRegistrationRequiredMap, setIsRegistrationRequiredMap] = useState<{
    [x: string]: boolean;
  }>({});
  const selectedRate = useSelector(rateSelector);
  const filteredRates = useMemo(() => filterRates(rates, filter), [rates, filter]);
  const providers = useMemo(() => [...new Set(rates?.map(rate => rate.provider) ?? [])], [rates]);
  const exchangeRates = useMemo(() => {
    return toCurrency && rates
      ? rates.map(({ toAmount }) => formatCurrencyUnit(getFeesUnit(toCurrency), toAmount))
      : [];
  }, [toCurrency, rates]);
  useEffect(() => {
    if (providers) {
      const fetchlol = async () => {
        const results = await Promise.all(
          providers.map(async provider => {
            const isRequired = await isRegistrationRequired(provider);
            return { [provider]: isRequired };
          }),
        );

        const resultsMap = results.reduce((acc, result) => ({ ...acc, ...result }), {});
        setIsRegistrationRequiredMap(resultsMap);
      };
      fetchlol();
    }
  }, [providers]);
  const updateRate = useCallback(
    (rate: ExchangeRate) => {
      const value = rate.rate ?? rate.provider;
      track("partner_clicked", {
        page: "Page Swap Form",
        ...swapDefaultTrack,
        swap_type: rate.tradeMethod,
        value,
        partner: rate.provider,
        defaultPartner,
      });
      dispatch(updateRateAction(rate));
    },
    [defaultPartner, dispatch, swapDefaultTrack],
  );

  useEffect(() => {
    // if the selected rate in redux is not in the filtered rates, we need to update it
    if (
      selectedRate &&
      filteredRates.length > 0 &&
      !filteredRates.some(
        r => r.provider === selectedRate.provider && r.tradeMethod === selectedRate.tradeMethod,
      )
    ) {
      const firstRate = filteredRates[0];
      setDefaultPartner(firstRate?.provider);
      dispatch(updateRateAction(firstRate));
    }

    // if there is no selected rate but there is a filtered rate, we need to update it
    if (!selectedRate && filteredRates.length > 0) {
      const firstRate = filteredRates[0];
      setDefaultPartner(firstRate?.provider);
      dispatch(updateRateAction(firstRate));
    }

    // if there are no filtered rates, we need to unset the selected rate
    if (selectedRate && filteredRates.length === 0) {
      setDefaultPartner(null);
      dispatch(updateRateAction(null));
    }
  }, [filteredRates, selectedRate, dispatch]);

  return (
    <Box height="100%" width="100%">
      <TrackPage
        category="Swap"
        name="Form - Edit Rates"
        provider={provider}
        partnersList={providers}
        exchangeRateList={exchangeRates}
        sourceCurrency={fromCurrency?.id}
        targetCurrency={toCurrency?.id}
        {...swapDefaultTrack}
      />
      <Box horizontal justifyContent="space-between" fontSize={5}>
        <Text
          color="neutral.c100"
          style={{
            textTransform: "uppercase",
            fontFamily: "Alpha",
          }}
        >
          <Trans i18nKey="swap2.form.rates.title" />
        </Text>
        {countdownSecondsToRefresh && (
          <Box horizontal fontSize={3}>
            <Countdown countdown={countdownSecondsToRefresh} />
          </Box>
        )}
      </Box>
      <TableHeader>
        <Box horizontal width="215px" alignItems="center" pr="38px">
          <Text mr={1}>
            <Trans i18nKey="swap2.form.rates.name.title" />
          </Text>
          <Tooltip
            content={
              <Box
                style={{
                  maxWidth: 250,
                }}
              >
                <Trans i18nKey="swap2.form.rates.name.tooltip" />
              </Box>
            }
          >
            <IconInfoCircle size={12} />
          </Tooltip>
        </Box>
        <Box horizontal flex="1" alignItems="center" justifyContent="flex-start">
          <Text mr={1}>
            <Trans i18nKey="swap2.form.rates.rate.title" />
          </Text>
          <Tooltip
            content={
              <Box
                style={{
                  maxWidth: 290,
                }}
              >
                <Text
                  style={{
                    textAlign: "left",
                  }}
                >
                  <Trans i18nKey="swap2.form.rates.rate.tooltip">
                    <Text ff="Inter|Bold" />
                  </Trans>
                </Text>
              </Box>
            }
          >
            <IconInfoCircle size={12} />
          </Tooltip>
        </Box>
        <Box horizontal flex="1" alignItems="center" justifyContent="flex-end" mr={1}>
          <Text mr={1}>
            <Trans i18nKey="swap2.form.rates.receive.title" />
          </Text>
          <Tooltip
            content={
              <Box
                style={{
                  maxWidth: 150,
                }}
              >
                <Text>
                  <Trans i18nKey="swap2.form.rates.receive.tooltip" />
                </Text>
              </Box>
            }
          >
            <Box>
              <IconInfoCircle size={12} />
            </Box>
          </Tooltip>
        </Box>
      </TableHeader>
      <Box mt={3}>
        {filteredRates.map(rate => {
          const isSelected =
            selectedRate &&
            selectedRate.provider === rate.provider &&
            selectedRate.tradeMethod === rate.tradeMethod;
          return rate.providerType === "DEX" && rate.rate === undefined ? (
            <NoQuoteSwapRate
              value={rate}
              selected={isSelected}
              onSelect={updateRate}
              icon={rate.provider}
            />
          ) : (
            <SwapRate
              key={`${rate.provider}-${rate.tradeMethod}`}
              value={rate}
              selected={isSelected}
              onSelect={updateRate}
              fromCurrency={fromCurrency}
              toCurrency={toCurrency}
              isRegistrationRequired={isRegistrationRequiredMap[rate.provider]}
            />
          );
        })}
      </Box>
      {!filteredRates.length && <LoadingState />}
    </Box>
  );
}
