import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import FormattedVal from "~/renderer/components/FormattedVal";
import { Address } from "~/renderer/components/OperationsList/AddressCell";
import OperationDate from "~/renderer/components/OperationsList/OperationDate";
import { TableRow as BaseTableRow } from "~/renderer/components/TableContainer";
import Text from "~/renderer/components/Text";
import Tooltip from "~/renderer/components/Tooltip";
import IconCross from "~/renderer/icons/Cross";
import IconReceive from "~/renderer/icons/Receive";
import IconSend from "~/renderer/icons/Send";
import {
  useProposalRowViewModel,
  type ProposalRowProps,
  type ProposalRowViewModel,
} from "./useProposalRowViewModel";

const TableRow = styled(BaseTableRow)`
  border-bottom: 1px solid ${p => p.theme.colors.neutral.c40};
`;

const MonospaceText = styled(Text)`
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
  letter-spacing: 0;
`;

type CountdownProps = {
  expiresAt: Date;
};

const CountdownDisplay: React.FC<CountdownProps> = ({ expiresAt }) => (
  <Box horizontal={false}>
    <OperationDate date={expiresAt} />
  </Box>
);

type ExpiresInDisplayProps = {
  timeRemaining: string;
  isExpired: boolean;
};

const ExpiresInDisplay: React.FC<ExpiresInDisplayProps> = ({ timeRemaining, isExpired }) => {
  const { t } = useTranslation();

  if (isExpired) {
    return (
      <Text fontSize={3} color="alertRed" ff="Inter">
        {t("families.canton.pendingTransactions.expired")}
      </Text>
    );
  }

  return (
    <MonospaceText fontSize={3} color="neutral.c80" ff="Inter">
      {timeRemaining || "-"}
    </MonospaceText>
  );
};

export function View({
  proposal,
  unit,
  timeRemaining,
  addressToShow,
  amountValue,
  handleAcceptClick,
  handleRejectClick,
  handleWithdrawClick,
  handleRowClick,
}: ProposalRowViewModel) {
  const { t } = useTranslation();
  const { isIncoming, isExpired, expiresAt } = proposal;

  return (
    <TableRow onClick={handleRowClick}>
      <Box horizontal alignItems="center" flex={1} style={{ height: "28px" }}>
        <Box px={3} horizontal={true} alignItems="center" style={{ minWidth: "120px" }}>
          <Box mr={2} alignItems="center" justifyContent="center">
            {isExpired ? (
              <Tooltip content={t("families.canton.pendingTransactions.status.expired")}>
                <Box color="alertRed">
                  <IconCross size={16} />
                </Box>
              </Tooltip>
            ) : isIncoming ? (
              <Tooltip content={t("families.canton.pendingTransactions.status.incoming")}>
                <IconReceive size={16} />
              </Tooltip>
            ) : (
              <Tooltip content={t("families.canton.pendingTransactions.status.outgoing")}>
                <IconSend size={16} />
              </Tooltip>
            )}
          </Box>
          <CountdownDisplay expiresAt={expiresAt} />
        </Box>

        <Box
          px={4}
          horizontal={true}
          alignItems="center"
          style={{ flex: 1, minWidth: 0, overflow: "hidden" }}
        >
          <Box style={{ width: "100%", minWidth: 0, overflow: "hidden" }}>
            <Address value={addressToShow} />
          </Box>
        </Box>

        <Box
          px={4}
          horizontal={true}
          alignItems="center"
          style={{
            flex: "0 0 auto",
            minWidth: "120px",
            height: "32px",
          }}
        >
          <ExpiresInDisplay timeRemaining={timeRemaining} isExpired={isExpired} />
        </Box>

        <Box
          px={4}
          horizontal={false}
          alignItems="flex-end"
          style={{
            flex: "0 0 auto",
            textAlign: "right",
            justifyContent: "center",
            height: "32px",
            minWidth: "150px",
          }}
        >
          <FormattedVal
            val={amountValue}
            unit={unit}
            showCode
            fontSize={4}
            alwaysShowSign
            color={isIncoming ? undefined : "neutral.c80"}
          />
        </Box>

        <Box
          px={3}
          horizontal={true}
          alignItems="center"
          style={{
            flex: "0 0 auto",
            gap: "8px",
            minWidth: "150px",
          }}
        >
          {isIncoming ? (
            <>
              {!isExpired && (
                <Button onClick={handleAcceptClick}>
                  {t("families.canton.pendingTransactions.accept")}
                </Button>
              )}
              <Button outline outlineColor="neutral.c100" onClick={handleRejectClick}>
                {t("families.canton.pendingTransactions.reject")}
              </Button>
            </>
          ) : (
            <Button outline outlineColor="neutral.c100" onClick={handleWithdrawClick}>
              {t("common.cancel")}
            </Button>
          )}
        </Box>
      </Box>
    </TableRow>
  );
}

function ProposalRow({ proposal, unit, onRowClick, onOpenModal }: ProposalRowProps) {
  return <View {...useProposalRowViewModel({ proposal, unit, onRowClick, onOpenModal })} />;
}

export default memo(ProposalRow);
