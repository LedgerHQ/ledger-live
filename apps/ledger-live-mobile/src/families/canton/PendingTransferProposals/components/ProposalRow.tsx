import { getAccountCurrency, shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { Button, Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import React, { memo } from "react";
import CounterValue from "~/components/CounterValue";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Touchable from "~/components/Touchable";
import { Trans, useTranslation } from "~/context/Locale";
import ArrowRight from "~/icons/ArrowRight";
import {
  useProposalRowViewModel,
  type ProposalRowProps,
  type ProposalRowViewModel,
} from "./useProposalRowViewModel";

type ViewProps = ProposalRowViewModel & {
  proposal: ProposalRowProps["proposal"];
  account: ProposalRowProps["account"];
  unit: ProposalRowProps["unit"];
};

export function View({
  proposal,
  account,
  timeRemaining,
  formattedTime,
  addressToShow,
  amountValue,
  amountColor,
  handleRowPress,
  handleWithdrawPress,
}: ViewProps) {
  const { t } = useTranslation();
  const { isIncoming, isExpired, contractId } = proposal;

  const getIcon = () => {
    if (isExpired) {
      return <IconsLegacy.CloseMedium size={16} color="error.c50" />;
    }
    if (isIncoming) {
      return <IconsLegacy.ArrowBottomMedium size={16} color="primary.c80" />;
    }
    return <ArrowRight size={16} color="neutral.c80" />;
  };

  return (
    <Touchable onPress={handleRowPress} testID={`proposal-row-${contractId}`}>
      <Flex
        flexDirection="row"
        alignItems="center"
        py={2}
        borderBottomWidth={1}
        borderBottomColor="neutral.c30"
      >
        <Flex mr={3} alignItems="center" justifyContent="center">
          {getIcon()}
        </Flex>

        <Flex flex={1} flexDirection="column">
          <Text variant="body" fontWeight="semiBold" color="neutral.c100" numberOfLines={1} mb={1}>
            {shortAddressPreview(addressToShow)}
          </Text>
          <Flex flexDirection="row" alignItems="center">
            <Text variant="small" color="neutral.c70" mr={2}>
              {formattedTime}
            </Text>
            {!isExpired && !!timeRemaining && (
              <Text variant="small" color="neutral.c70">
                • {timeRemaining}
              </Text>
            )}
            {isExpired && (
              <Text variant="small" color="error.c50">
                • {t("canton.pendingTransactions.expired")}
              </Text>
            )}
          </Flex>
        </Flex>

        <Flex alignItems="flex-end" mr={3}>
          <Text variant="body" fontWeight="semiBold" color={amountColor}>
            <CurrencyUnitValue unit={proposal.unit} value={amountValue} showCode alwaysShowSign />
          </Text>
          <Text variant="small" color="neutral.c70" mt={0.5}>
            <CounterValue
              currency={getAccountCurrency(account)}
              value={amountValue}
              showCode
              alwaysShowSign
            />
          </Text>
        </Flex>

        <Flex flexDirection="row" pr={4}>
          {isIncoming ? (
            <Button type="shade" onPress={handleRowPress} mr={2}>
              <Trans i18nKey="canton.pendingTransactions.review" />
            </Button>
          ) : (
            <Button
              type="main"
              outline
              iconName="Close"
              onPress={handleWithdrawPress}
              testID={`withdraw-button-${contractId}`}
            />
          )}
        </Flex>
      </Flex>
    </Touchable>
  );
}

function ProposalRow({ proposal, account, unit, onRowClick, onOpenModal }: ProposalRowProps) {
  const viewModel = useProposalRowViewModel({ proposal, onRowClick, onOpenModal });
  return <View {...viewModel} proposal={proposal} account={account} unit={unit} />;
}

export default memo(ProposalRow);
