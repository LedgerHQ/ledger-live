import { Divider } from "@ledgerhq/react-ui/index";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CopyWithFeedback from "~/renderer/components/CopyWithFeedback";
import FormattedVal from "~/renderer/components/FormattedVal";
import { SplitAddress } from "~/renderer/components/OperationsList/AddressCell";
import Text from "~/renderer/components/Text";
import {
  GradientHover,
  HashContainer,
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import IconCheck from "~/renderer/icons/Check";
import IconCross from "~/renderer/icons/Cross";
import type { ProcessedProposal, TransferProposalAction } from "./types";
import {
  usePendingTransferProposalsDetailsViewModel,
  type PendingTransferProposalsDetailsViewModel,
} from "./usePendingTransferProposalsDetailsViewModel";

export type PendingTransferProposalsDetailsProps = {
  onClose?: () => void;
  account: Account;
  proposal: ProcessedProposal | null;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
};

export function View({
  proposal,
  unit,
  dateFormatted,
  timeRemaining,
  handleAction,
}: PendingTransferProposalsDetailsViewModel) {
  const { t } = useTranslation();

  if (!proposal) {
    return (
      <Box p={4}>
        <Text>{t("common.notFound")}</Text>
      </Box>
    );
  }

  const { isIncoming } = proposal;

  return (
    <Box flow={3} px={20} style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <Box mb={4}>
        <Text ff="Inter|SemiBold" fontSize={6} color="neutral.c100">
          {isIncoming
            ? t("families.canton.pendingTransactions.incoming.detailsTitle")
            : t("families.canton.pendingTransactions.outgoing.detailsTitle")}
        </Text>
      </Box>
      <OpDetailsSection>
        <OpDetailsTitle>{t("families.canton.pendingTransactions.amount")}</OpDetailsTitle>
        <OpDetailsData>
          <Box alignItems="flex-end">
            <FormattedVal
              val={isIncoming ? proposal.amount : proposal.amount.negated()}
              unit={unit}
              showCode
              fontSize={4}
              alwaysShowSign
              color={isIncoming ? undefined : "neutral.c80"}
            />
          </Box>
        </OpDetailsData>
      </OpDetailsSection>

      <OpDetailsSection>
        <OpDetailsTitle>{t("families.canton.pendingTransactions.from")}</OpDetailsTitle>
        <OpDetailsData>
          <HashContainer>
            <SplitAddress value={proposal.sender} />
          </HashContainer>
          <GradientHover>
            <CopyWithFeedback text={proposal.sender} />
          </GradientHover>
        </OpDetailsData>
      </OpDetailsSection>

      <OpDetailsSection>
        <OpDetailsTitle>{t("families.canton.pendingTransactions.to")}</OpDetailsTitle>
        <OpDetailsData>
          <HashContainer>
            <SplitAddress value={proposal.receiver} />
          </HashContainer>
          <GradientHover>
            <CopyWithFeedback text={proposal.receiver} />
          </GradientHover>
        </OpDetailsData>
      </OpDetailsSection>

      {proposal.memo && (
        <OpDetailsSection>
          <OpDetailsTitle>{t("families.canton.pendingTransactions.memo")}</OpDetailsTitle>
          <OpDetailsData>{proposal.memo}</OpDetailsData>
        </OpDetailsSection>
      )}

      <OpDetailsSection>
        <OpDetailsTitle>{t("families.canton.pendingTransactions.expiresAt")}</OpDetailsTitle>
        <OpDetailsData>{dateFormatted}</OpDetailsData>
      </OpDetailsSection>

      {!proposal.isExpired && timeRemaining && (
        <OpDetailsSection>
          <OpDetailsTitle>{t("families.canton.pendingTransactions.expiresIn")}</OpDetailsTitle>
          <OpDetailsData>{timeRemaining}</OpDetailsData>
        </OpDetailsSection>
      )}

      {proposal.isExpired && (
        <OpDetailsSection>
          <OpDetailsTitle>{t("families.canton.pendingTransactions.status.label")}</OpDetailsTitle>
          <OpDetailsData color="alertRed">
            {t("families.canton.pendingTransactions.expired")}
          </OpDetailsData>
        </OpDetailsSection>
      )}

      <Divider />

      <OpDetailsSection>
        <OpDetailsTitle>
          {t("families.canton.pendingTransactions.deviceAppModal.contractId")}
        </OpDetailsTitle>
        <OpDetailsData>
          <HashContainer>
            <SplitAddress value={proposal.contractId} />
          </HashContainer>
          <GradientHover>
            <CopyWithFeedback text={proposal.contractId} />
          </GradientHover>
        </OpDetailsData>
      </OpDetailsSection>

      <Divider />

      <Box horizontal mt="auto" pb={20} flow={2} style={{ width: "100%" }}>
        {isIncoming ? (
          <>
            <Box flex={1}>
              <Button
                fullWidth
                disabled={proposal.isExpired}
                onClick={() => handleAction("accept")}
              >
                <Box horizontal alignItems="center" style={{ gap: "8px" }}>
                  {t("families.canton.pendingTransactions.accept")}
                  <IconCheck size={16} />
                </Box>
              </Button>
            </Box>
            <Box flex={1}>
              <Button
                fullWidth
                style={{
                  borderColor: "neutral.c100",
                  borderWidth: 1,
                  backgroundColor: "transparent",
                }}
                onClick={() => handleAction("reject")}
              >
                <Box horizontal alignItems="center" style={{ gap: "8px" }}>
                  {t("families.canton.pendingTransactions.reject")}
                </Box>
              </Button>
            </Box>
          </>
        ) : (
          <Box flex={1}>
            <Button fullWidth onClick={() => handleAction("withdraw")}>
              <Box horizontal alignItems="center" style={{ gap: "8px" }}>
                {t("common.cancel")}
                <IconCross size={16} />
              </Box>
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

const PendingTransferProposalsDetails: React.FC<PendingTransferProposalsDetailsProps> = ({
  account,
  proposal,
  onClose,
  onOpenModal,
}) => {
  return (
    <View
      {...usePendingTransferProposalsDetailsViewModel({ account, proposal, onOpenModal, onClose })}
    />
  );
};

export default PendingTransferProposalsDetails;
