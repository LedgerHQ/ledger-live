import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  isSwapOperationPending,
  operationStatusList,
} from "@ledgerhq/live-common/exchange/swap/index";
import { MappedSwapOperation } from "@ledgerhq/live-common/exchange/swap/types";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import React from "react";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme } from "styled-components";
import Box from "~/renderer/components/Box";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Ellipsis from "~/renderer/components/Ellipsis";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import Tooltip from "~/renderer/components/Tooltip";
import IconArrowRight from "~/renderer/icons/ArrowRight";
import IconClock from "~/renderer/icons/Clock";
import IconSwap from "~/renderer/icons/Swap";
import { rgba } from "~/renderer/styles/helpers";
import { hourFormat, useDateFormatted } from "~/renderer/hooks/useDateFormatter";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useAccountName } from "~/renderer/reducers/wallet";

export const getStatusColor = (status: string, theme: DefaultTheme) => {
  if (isSwapOperationPending(status)) {
    return status === "hold" ? theme.colors.orange : theme.colors.wallet;
  }
  if (operationStatusList.finishedOK.includes(status)) {
    return theme.colors.positiveGreen;
  }
  if (operationStatusList.finishedKO.includes(status)) {
    return theme.colors.alertRed;
  }
  return theme.colors.palette.text.shade50;
};

const Status = styled.div<{ status: string }>`
  height: 24px;
  width: 24px;
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: ${p => rgba(getStatusColor(p.status, p.theme), 0.1)};
  & > * {
    color: ${p => getStatusColor(p.status, p.theme)};
  }
`;
const WrapperClock = styled(Box).attrs(() => ({
  bg: "palette.background.paper",
  color: "palette.text.shade60",
}))`
  border-radius: 50%;
  position: absolute;
  bottom: -4px;
  right: -4px;
  padding: 1px;
`;
const Row = styled(Box)<{ isOptimistic?: boolean; toExists?: boolean }>`
  border-bottom: 1px solid ${p => p.theme.colors.palette.divider};
  height: 68px;
  opacity: ${p => (p.isOptimistic || !p.toExists ? 0.5 : 1)};
  cursor: pointer;

  &:hover {
    background: ${p => rgba(p.theme.colors.wallet, 0.04)};
  }

  padding: 24px;
  & > *:nth-child(2) {
    flex: 10%;
  }
  & > *:nth-child(6) {
    flex: 20%;
  }
  & > *:nth-child(3),
  & > *:nth-child(5) {
    flex: 20%;
  }
`;
const OperationRow = ({
  mappedSwapOperation,
  openSwapOperationDetailsModal,
}: {
  mappedSwapOperation: MappedSwapOperation;
  openSwapOperationDetailsModal: (a: MappedSwapOperation) => void;
}) => {
  const {
    fromAccount,
    toAccount,
    fromAmount,
    toAmount,
    provider,
    swapId,
    operation,
    status,
    toExists,
  } = mappedSwapOperation;
  const fromCurrency = getAccountCurrency(fromAccount);
  const toCurrency = getAccountCurrency(toAccount);
  const dateFormatted = useDateFormatted(operation.date, hourFormat);
  const { t } = useTranslation();

  const unitFrom = useAccountUnit(fromAccount);
  const unitTo = useAccountUnit(toAccount);
  const fromAccountName = useAccountName(fromAccount);
  const toAccountName = useAccountName(toAccount);

  return (
    <Row
      className={"swap-history-row"}
      toExists={toExists}
      horizontal
      key={swapId}
      alignItems={"center"}
      onClick={() => openSwapOperationDetailsModal(mappedSwapOperation)}
      data-testid={`operation-row-${swapId}`}
    >
      <Tooltip content={<span>{t(`swap2.history.status.${status}`)}</span>}>
        <Status status={status}>
          <IconSwap size={12} />
          {isSwapOperationPending(status) ? (
            <WrapperClock>
              <IconClock size={10} />
            </WrapperClock>
          ) : null}
        </Status>
      </Tooltip>
      <Box ml={24}>
        <Text
          data-testid={`swap-history-provider-${swapId}`}
          ff={"Inter|SemiBold"}
          color={"palette.text.shade100"}
          fontSize={3}
        >
          {getProviderName(provider)}
        </Text>
        <Text
          data-testid={`swap-history-date-${swapId}`}
          ff={"Inter|Regular"}
          color={"palette.text.shade50"}
          fontSize={3}
        >
          {dateFormatted}
        </Text>
      </Box>
      <Box horizontal mx={20}>
        <Box alignItems="center" justifyContent="center">
          <CryptoCurrencyIcon size={16} currency={fromCurrency} />
        </Box>
        <Tooltip delay={1200} content={fromAccountName}>
          <Ellipsis
            data-testid={`swap-history-from-account-${swapId}`}
            ff="Inter|SemiBold"
            ml={1}
            color="palette.text.shade100"
            fontSize={3}
          >
            {fromAccountName}
          </Ellipsis>
        </Tooltip>
      </Box>
      <Box color={"palette.text.shade30"}>
        <IconArrowRight size={16} />
      </Box>
      <Box horizontal mx={20}>
        <Box alignItems="center" justifyContent="center">
          <CryptoCurrencyIcon size={16} currency={toCurrency} />
        </Box>
        <Tooltip delay={1200} content={toAccountName}>
          <Ellipsis
            data-testid={`swap-history-to-account-${swapId}`}
            ff="Inter|SemiBold"
            ml={1}
            color="palette.text.shade100"
            fontSize={3}
          >
            {toAccountName}
          </Ellipsis>
        </Tooltip>
      </Box>
      <Box alignItems={"flex-end"} ml={20}>
        <Text data-testid={`swap-history-to-amount-${swapId}`} ff={"Inter|SemiBold"} fontSize={4}>
          <FormattedVal alwaysShowSign val={toAmount} unit={unitTo} showCode />
        </Text>
        <Text data-testid={`swap-history-from-amount-${swapId}`} ff={"Inter|SemiBold"} fontSize={3}>
          <FormattedVal
            color="palette.text.shade60"
            alwaysShowSign
            val={fromAmount.times(-1)}
            unit={unitFrom}
            showCode
          />
        </Text>
      </Box>
    </Row>
  );
};
export default OperationRow;
