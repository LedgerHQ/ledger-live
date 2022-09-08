// @flow
import type {
  RatesReducerState,
  SwapSelectorStateType,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import type { KYCStatus } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import React, { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Text from "~/renderer/components/Text";
import { context } from "~/renderer/drawers/Provider";
import CheckCircleIcon from "~/renderer/icons/CheckCircle";
import ClockIcon from "~/renderer/icons/Clock";
import ExclamationCircleIcon from "~/renderer/icons/ExclamationCircle";
import { rgba } from "~/renderer/styles/helpers";
import { iconByProviderName } from "../../utils";
import Rates from "../Rates";
import ProvidersSection from "./ProvidersSection";
import ProvidersValue, { NoValuePlaceholder } from "./ProvidersValue";

const StatusTag = styled.div`
  display: flex;
  padding: 4px 6px;
  border-radius: 4px;
  background: ${props => rgba(props.theme.colors[props.color], 0.1)};
  color: ${props => props.theme.colors[props.color]};
  align-items: center;
  column-gap: 4px;
`;

export type SectionProviderProps = {
  provider?: string,
  status?: KYCStatus,
  ratesState: RatesReducerState,
  fromCurrency: $PropertyType<SwapSelectorStateType, "currency">,
  toCurrency: $PropertyType<SwapSelectorStateType, "currency">,
};
type ProviderStatusTagProps = {
  status: $NonMaybeType<$PropertyType<SectionProviderProps, "status">>,
};

const StatusThemeMap = {
  pending: { color: "warning", Icon: ClockIcon },
  approved: { color: "marketUp_western", Icon: CheckCircleIcon },
  closed: { color: "alertRed", Icon: ExclamationCircleIcon },
  upgradeRequired: { color: "warning", Icon: ClockIcon },
};

const ProviderStatusTag = ({ status }: ProviderStatusTagProps) => {
  const { t } = useTranslation();
  const { color, Icon } = StatusThemeMap[status] || { color: null, icon: null };

  return (
    <StatusTag color={color}>
      <Text ff="Inter|SemiBold" fontSize="9px" lineHeight="1.4">
        {t(`swap2.form.providers.kyc.status.${status}`)}
      </Text>
      <Icon size={12} />
    </StatusTag>
  );
};

const SectionProvider = ({
  provider,
  status,
  fromCurrency,
  toCurrency,
  ratesState,
  countdown,
  setSelectedRate,
}: SectionProviderProps) => {
  const { t } = useTranslation();
  const ProviderIcon = provider && iconByProviderName[provider.toLowerCase()];

  const { setDrawer } = useContext(context);
  const rates = ratesState.value;
  const loadingRates = ratesState.status === "loading";

  return (
    <ProvidersSection>
      {(provider && (
        <Rates
          {...{
            fromCurrency,
            toCurrency,
            rates,
            provider,
            countdown,
            loadingRates,
            setSelectedRate,
          }}
        />
      )) || (
        <ProvidersValue>
          <NoValuePlaceholder />
        </ProvidersValue>
      )}
    </ProvidersSection>
  );
};

export default React.memo<SectionProviderProps>(SectionProvider);
