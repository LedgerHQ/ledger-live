import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import PortfolioEmptyState from "~/screens/Portfolio/PortfolioEmptyState";

interface PortfolioEmptyStateSectionProps {
  readonly openAddModal: () => void;
}

export const PortfolioEmptyStateSection = ({ openAddModal }: PortfolioEmptyStateSectionProps) => {
  return (
    <Flex flexDirection="column" mt={30} mx={6} key="PortfolioEmptyState">
      <PortfolioEmptyState openAddAccountModal={openAddModal} />
    </Flex>
  );
};
