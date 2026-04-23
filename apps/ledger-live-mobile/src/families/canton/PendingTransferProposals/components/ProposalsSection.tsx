import { Flex } from "@ledgerhq/native-ui";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import SectionHeader from "~/components/SectionHeader";
import { useTranslation } from "~/context/Locale";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";
import SectionTitle from "~/screens/WalletCentricSections/SectionTitle";
import type { GroupedProposals, TransferProposalAction } from "../types";
import ProposalRow from "./ProposalRow";

type Props = {
  proposals: GroupedProposals;
  titleKey: string;
  account: Account;
  unit: Unit;
  onRowClick: (contractId: string) => void;
  onOpenModal: (contractId: string, action: TransferProposalAction) => void;
};

function ProposalsSection({ proposals, titleKey, account, unit, onRowClick, onOpenModal }: Props) {
  const { t } = useTranslation();

  if (proposals.length === 0) return null;

  return (
    <SectionContainer>
      <SectionTitle title={t(titleKey)} containerProps={{ mb: 4, px: 6 }} />
      {proposals.map(group => (
        <Flex key={group.day.getTime()}>
          <Flex px={4}>
            <SectionHeader day={group.day} />
          </Flex>
          {group.proposals.map(proposal => (
            <ProposalRow
              key={proposal.contractId}
              proposal={proposal}
              account={account}
              unit={unit}
              onRowClick={onRowClick}
              onOpenModal={onOpenModal}
            />
          ))}
        </Flex>
      ))}
    </SectionContainer>
  );
}

export default ProposalsSection;
