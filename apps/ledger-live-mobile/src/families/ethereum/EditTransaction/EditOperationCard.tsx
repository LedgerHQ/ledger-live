import React from "react";
import { useTranslation } from "react-i18next";
import { SideImageCard } from "@ledgerhq/native-ui";
import { Operation } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import SectionContainer from "../../../screens/WalletCentricSections/SectionContainer";

type EditOperationCardProps = {
  oldestEditableOperation: Operation;
  isOperationStuck: boolean;
  onEditTransactionPress: (operation: Operation) => void;
};

export const EditOperationCard = ({
  oldestEditableOperation,
  isOperationStuck,
  onEditTransactionPress,
}: EditOperationCardProps) => {
  const { t } = useTranslation();
  const flag = useFeature("editEthTx");

  return flag?.enabled ? (
    <SectionContainer px={6}>
      <SideImageCard
        title={t(
          isOperationStuck
            ? "editTransaction.panel.stuckMessage"
            : "editTransaction.panel.speedupMessage",
        )}
        cta={t("editTransaction.cta")}
        onPress={() => onEditTransactionPress(oldestEditableOperation)}
      />
    </SectionContainer>
  ) : null;
};
