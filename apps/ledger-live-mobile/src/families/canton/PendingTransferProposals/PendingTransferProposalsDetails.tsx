import { withoutBidiControls } from "@ledgerhq/live-common/families/canton/proposalSorting";
import { Box, Button, Flex, Text } from "@ledgerhq/native-ui";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { ScrollView, TouchableOpacity, useWindowDimensions } from "react-native";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import FormatDate from "~/components/DateFormat/FormatDate";
import QueuedDrawer from "~/components/QueuedDrawer";
import { Trans, useTranslation } from "~/context/Locale";
import { type ProcessedProposal, type TransferProposalAction } from "./types";
import {
  usePendingTransferProposalsDetailsViewModel,
  type PendingTransferProposalsDetailsViewModel,
} from "./usePendingTransferProposalsDetailsViewModel";

type Props = {
  account: Account;
  proposal: ProcessedProposal | null;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
  isOpen: boolean;
  onClose?: () => void;
};

type ViewProps = PendingTransferProposalsDetailsViewModel & {
  proposal: ProcessedProposal | null;
  isOpen: boolean;
  onClose?: () => void;
};

// The drawer doesn't scroll, so the details do, leaving room for the title and the actions.
const DETAILS_MAX_HEIGHT_RATIO = 0.55;

export function View({
  timeRemaining,
  isExpired,
  handleAction,
  handleCopy,
  proposal,
  isOpen,
  onClose,
}: ViewProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();

  if (!proposal) {
    return (
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
        <Box p={4}>
          <Text>{t("common.notFound")}</Text>
        </Box>
      </QueuedDrawer>
    );
  }

  const { isIncoming } = proposal;
  const directionColor = isIncoming ? "success.c50" : "neutral.c70";
  const amountColor = proposal.isUnknownInstrument ? "warning.c70" : directionColor;

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      title={t(
        isIncoming
          ? "canton.pendingTransactions.details.incomingTitle"
          : "canton.pendingTransactions.details.outgoingTitle",
      )}
    >
      <Flex flexDirection="column" px={6} py={4}>
        <ScrollView
          style={{ maxHeight: height * DETAILS_MAX_HEIGHT_RATIO }}
          showsVerticalScrollIndicator={false}
        >
          <Flex mb={8}>
            <Text variant="paragraph" color="neutral.c70" mb={2}>
              {t("canton.pendingTransactions.amount")}
            </Text>
            <Text variant="body" fontWeight="semiBold" color={amountColor}>
              <CurrencyUnitValue
                unit={proposal.unit}
                value={isIncoming ? proposal.amount : proposal.amount.negated()}
                showCode
                alwaysShowSign
              />
            </Text>
          </Flex>

          {proposal.isUnknownInstrument && (
            <>
              <Flex mb={8}>
                <Text variant="paragraph" color="neutral.c70" mb={2}>
                  {t("canton.pendingTransactions.instrumentId")}
                </Text>
                <Text variant="body" color="neutral.c100">
                  {withoutBidiControls(proposal.instrumentId)}
                </Text>
              </Flex>
              <Flex mb={8}>
                <Text variant="paragraph" color="neutral.c70" mb={2}>
                  {t("canton.pendingTransactions.instrumentAdmin")}
                </Text>
                <TouchableOpacity onPress={() => handleCopy(proposal.instrumentAdmin)}>
                  <Text
                    variant="body"
                    color="neutral.c100"
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {proposal.instrumentAdmin}
                  </Text>
                </TouchableOpacity>
              </Flex>
            </>
          )}

          <Flex mb={8}>
            <Text variant="paragraph" color="neutral.c70" mb={2}>
              {t("canton.pendingTransactions.from")}
            </Text>
            <TouchableOpacity onPress={() => handleCopy(proposal.sender)}>
              <Text variant="body" color="neutral.c100" numberOfLines={1} ellipsizeMode="middle">
                {proposal.sender}
              </Text>
            </TouchableOpacity>
          </Flex>

          <Flex mb={8}>
            <Text variant="paragraph" color="neutral.c70" mb={2}>
              {t("canton.pendingTransactions.to")}
            </Text>
            <TouchableOpacity onPress={() => handleCopy(proposal.receiver)}>
              <Text variant="body" color="neutral.c100" numberOfLines={1} ellipsizeMode="middle">
                {proposal.receiver}
              </Text>
            </TouchableOpacity>
          </Flex>

          {proposal.memo && (
            <Flex mb={8}>
              <Text variant="paragraph" color="neutral.c70" mb={2}>
                {t("canton.pendingTransactions.memo")}
              </Text>
              <Text variant="body" color="neutral.c100">
                {proposal.memo}
              </Text>
            </Flex>
          )}

          <Flex mb={8}>
            <Text variant="paragraph" color="neutral.c70" mb={2}>
              {t("canton.pendingTransactions.expiresAt")}
            </Text>
            <Text variant="body" color="neutral.c100">
              <FormatDate date={proposal.expiresAt} />
            </Text>
          </Flex>

          {!isExpired && !!timeRemaining && (
            <Flex mb={8}>
              <Text variant="paragraph" color="neutral.c70" mb={2}>
                {t("canton.pendingTransactions.expiresIn")}
              </Text>
              <Text variant="body" color="neutral.c100">
                {timeRemaining}
              </Text>
            </Flex>
          )}

          {isExpired && (
            <Flex mb={8}>
              <Text variant="paragraph" color="neutral.c70" mb={2}>
                {t("canton.pendingTransactions.status.label")}
              </Text>
              <Text variant="body" color="error.c50">
                {t("canton.pendingTransactions.expired")}
              </Text>
            </Flex>
          )}

          <Flex mb={8}>
            <Text variant="paragraph" color="neutral.c70" mb={2}>
              {t("canton.pendingTransactions.deviceAppModal.contractId")}
            </Text>
            <TouchableOpacity onPress={() => handleCopy(proposal.contractId)}>
              <Text variant="body" color="neutral.c100" numberOfLines={1} ellipsizeMode="middle">
                {proposal.contractId}
              </Text>
            </TouchableOpacity>
          </Flex>
        </ScrollView>

        <Flex flexDirection="row" mt={4} justifyContent="center" columnGap={8}>
          {isIncoming ? (
            <>
              {!isExpired && (
                <Button
                  type="shade"
                  onPress={() => handleAction("accept")}
                  iconName="CheckAlone"
                  flex={1}
                >
                  <Trans i18nKey="canton.pendingTransactions.accept" />
                </Button>
              )}
              <Button
                outline
                type="main"
                onPress={() => handleAction("reject")}
                iconName="Close"
                flex={1}
              >
                <Trans i18nKey="canton.pendingTransactions.reject" />
              </Button>
            </>
          ) : (
            <Button
              outline
              type="main"
              iconName="Close"
              onPress={() => handleAction("withdraw")}
              flex={1}
            >
              <Trans i18nKey="canton.pendingTransactions.withdraw" />
            </Button>
          )}
        </Flex>
      </Flex>
    </QueuedDrawer>
  );
}

const PendingTransferProposalsDetails: React.FC<Props> = ({
  account,
  proposal,
  onOpenModal,
  isOpen,
  onClose,
}) => {
  const viewModel = usePendingTransferProposalsDetailsViewModel({ account, proposal, onOpenModal });
  return <View {...viewModel} proposal={proposal} isOpen={isOpen} onClose={onClose} />;
};

export default PendingTransferProposalsDetails;
