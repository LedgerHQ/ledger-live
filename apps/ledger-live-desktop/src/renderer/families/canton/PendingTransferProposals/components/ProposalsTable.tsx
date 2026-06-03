import { Unit } from "@ledgerhq/types-cryptoassets";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import SectionTitle from "~/renderer/components/OperationsList/SectionTitle";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import Text from "~/renderer/components/Text";
import type { GroupedProposals, TransferProposalAction } from "../types";
import ProposalRow from "./ProposalRow";

const TableHeaderRow = styled(Box)`
  border-bottom: 1px solid ${p => p.theme.colors.neutral.c40};
  background-color: ${p => p.theme.colors.background.main};
  padding: 12px 0;
`;

type ProposalsTableProps = {
  proposals: GroupedProposals;
  count: number;
  titleKey: string;
  isIncomingTable: boolean;
  unit: Unit;
  onRowClick: (contractId: string) => void;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
};

function ProposalsTable({
  proposals,
  count,
  titleKey,
  isIncomingTable,
  unit,
  onRowClick,
  onOpenModal,
}: ProposalsTableProps) {
  const { t } = useTranslation();

  if (count === 0) return null;

  return (
    <TableContainer mb={7}>
      <TableHeader
        title={t(titleKey, { count })}
        titleProps={{
          "data-e2e": `canton_PendingTransactions_${isIncomingTable ? "incoming" : "outgoing"}`,
        }}
      />
      <TableHeaderRow>
        <Box horizontal alignItems="center" flex={1} style={{ height: "28px" }} px={4}>
          <Box px={3} horizontal={true} alignItems="center" style={{ minWidth: "120px" }}>
            <Box horizontal={false}>
              <Text fontSize={3} color="neutral.c70" ff="Inter|SemiBold">
                {t("families.canton.pendingTransactions.date")}
              </Text>
            </Box>
          </Box>
          <Box px={4} horizontal={true} alignItems="center" style={{ flex: 1 }}>
            <Text fontSize={3} color="neutral.c70" ff="Inter|SemiBold">
              {isIncomingTable
                ? t("families.canton.pendingTransactions.from")
                : t("families.canton.pendingTransactions.to")}
            </Text>
          </Box>
          <Box
            px={4}
            horizontal={false}
            style={{
              flex: "0 0 auto",
              minWidth: "120px",
            }}
          >
            <Text fontSize={3} color="neutral.c70" ff="Inter|SemiBold">
              {t("families.canton.pendingTransactions.expiresIn")}
            </Text>
          </Box>
          <Box
            px={4}
            horizontal={false}
            style={{
              flex: "0 0 auto",
              textAlign: "right",
              justifyContent: "center",
              minWidth: "150px",
            }}
          >
            <Text fontSize={3} color="neutral.c70" ff="Inter|SemiBold">
              {t("families.canton.pendingTransactions.amount")}
            </Text>
          </Box>
          <Box
            px={3}
            horizontal={true}
            alignItems="center"
            justifyContent="flex-end"
            style={{
              flex: "0 0 auto",
              gap: "4px",
              minWidth: "220px",
            }}
          >
            <Text fontSize={3} color="neutral.c70" ff="Inter|SemiBold">
              {t("families.canton.pendingTransactions.action")}
            </Text>
          </Box>
        </Box>
      </TableHeaderRow>
      {proposals.map(group => (
        <Box key={group.day.getTime()}>
          <SectionTitle date={group.day} />
          <Box p={0}>
            {group.proposals.map(proposal => (
              <ProposalRow
                key={proposal.contractId}
                proposal={proposal}
                unit={unit}
                onRowClick={onRowClick}
                onOpenModal={onOpenModal}
              />
            ))}
          </Box>
        </Box>
      ))}
    </TableContainer>
  );
}

export default ProposalsTable;
