// @flow
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Rate from "./Rate";
import Countdown from './Countdown'
import type {
  SwapSelectorStateType,
  RatesReducerState,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { rateSelector, updateRateAction } from "~/renderer/actions/swap";
import TrackPage from "~/renderer/analytics/TrackPage";
import { SWAP_VERSION } from "../../utils/index";
import styled from "styled-components";
import Tooltip from "~/renderer/components/Tooltip";
import IconInfoCircle from "~/renderer/icons/InfoCircle";

type Props = {
  fromCurrency: $PropertyType<SwapSelectorStateType, "currency">,
  toCurrency: $PropertyType<SwapSelectorStateType, "currency">,
  rates: $PropertyType<RatesReducerState, "value">,
  provider: ?string,
  refreshTime: number,
};
export default function ProviderRate({
  fromCurrency,
  toCurrency,
  rates,
  provider,
  updateSelectedRate,
  refreshTime,
}: Props) {
  const dispatch = useDispatch();
  const selectedRate = useSelector(rateSelector);

  const setRate = useCallback(
    rate => {
      updateSelectedRate(rate);
      dispatch(updateRateAction(rate));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch],
  );

  const TableHeader: ThemedComponent<{}> = styled(Box).attrs({
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
  return (
    <Box height="100%" width="100%">
      <TrackPage
        category="Swap"
        name="Form - Edit Rates"
        provider={provider}
        swapVersion={SWAP_VERSION}
      />
      <Box horizontal justifyContent="space-between" fontSize={5}>
        <Text variant="h5" style={{ textTransform: "uppercase", fontFamily: "Alpha" }}>
          <Trans i18nKey="swap2.form.rates.title" />
        </Text>
        <Box horizontal fontSize={3}>
          <Countdown refreshTime={refreshTime} rates={rates}/>
        </Box>
      </Box>
      <TableHeader>
        <Box horizontal flex="1" alignItems="center" pr="38px">
          <Text alignItems="center" display="flex" mr={1}>
            <Trans i18nKey="swap2.form.rates.name.title" />
          </Text>
          <Tooltip
            content={
              <Box style={{ maxWidth: 250 }}>
                <Trans i18nKey="swap2.form.rates.name.tooltip" />
              </Box>
            }
          >
            <IconInfoCircle size={12} />
          </Tooltip>
        </Box>
        <Box horizontal flex="1" alignItems="center" justifyContent="center">
          <Text alignItems="center" display="flex" mr={1}>
            <Trans i18nKey="swap2.form.rates.rate.title" />
          </Text>
          <Tooltip
            content={
              <Box style={{ maxWidth: 290 }}>
                <Text style={{ textAlign: "left" }}>
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
        <Box horizontal flex="1" alignItems="center" justifyContent="flex-end">
          <Text alignItems="center" display="flex" mr={1}>
            <Trans i18nKey="swap2.form.rates.receive.title" />
          </Text>
          <Tooltip
            placement={"top-end"}
            content={
              <Box style={{ maxWidth: 150 }}>
                <Text style={{ textAlign: "right" }}>
                  <Trans i18nKey="swap2.form.rates.receive.tooltip" />
                </Text>
              </Box>
            }
          >
            <Box  style={{ marginRight: 5}}>
              <IconInfoCircle size={12} />
            </Box>
          </Tooltip>
        </Box>
      </TableHeader>
      <Box mt={3}>
        {rates?.map((rate, index) => (
          <Rate
            key={rate.rateId || index}
            value={rate}
            selected={rate === selectedRate}
            onSelect={setRate}
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
          />
        ))}
      </Box>
    </Box>
  );
}
