import React from "react";
import { StyleSheet } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Globe, ShieldLock } from "@ledgerhq/lumen-ui-rnative/symbols";
import { getOperationDetailsExtraFields } from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoOperation, AleoTransactionType } from "@ledgerhq/live-common/families/aleo/types";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { useTranslation } from "~/context/Locale";
import Section from "~/screens/OperationDetails/Section";
import OperationStatusIcon from "~/icons/OperationStatusIcon";

interface OperationDetailsExtraProps {
  operation: AleoOperation;
}

const OperationDetailsExtra = ({ operation }: OperationDetailsExtraProps) => {
  const { t } = useTranslation();

  const extraFields = getOperationDetailsExtraFields(operation.extra);

  return (
    <>
      {extraFields.map(item => (
        <Section
          title={t(`operationDetails.extra.${item.key}`)}
          value={String(item.value)}
          key={item.key}
        />
      ))}
    </>
  );
};

const mapTransactionTypeToTranslationKey: Record<AleoTransactionType, string> = {
  public: "aleo.operations.type.public",
  private: "aleo.operations.type.private",
};

const mapTransactionTypeToIcon: Record<AleoTransactionType, typeof ShieldLock> = {
  public: Globe,
  private: ShieldLock,
};

// Badge scales with the main icon (e.g. 40px in the list row vs 57px in
// operation details), so it stays visually consistent across both screens.
const BADGE_SIZE_RATIO = 0.5;
const BADGE_ICON_SIZE_RATIO = 0.6;
const BADGE_ICON_STROKE_WIDTH = 1;

interface AleoOperationStatusIconProps {
  operation: Operation;
  confirmed: boolean;
  type: OperationType;
  failed?: boolean;
  size: number;
}

// Renders the usual incoming/outgoing status icon, with a small bordered shield
// (private) or globe (public) badge overflowing off its bottom-right corner —
// same visual style (border + base background) as the status icon itself.
const AleoOperationStatusIcon = ({
  operation,
  confirmed,
  type,
  failed,
  size,
}: AleoOperationStatusIconProps) => {
  const { t } = useTranslation();
  const transactionType = (operation as AleoOperation).extra?.transactionType;
  const BadgeIcon = transactionType && mapTransactionTypeToIcon[transactionType];

  const statusIcon = (
    <OperationStatusIcon confirmed={confirmed} type={type} failed={failed} size={size} />
  );

  if (!transactionType || !BadgeIcon) {
    return statusIcon;
  }

  const badgeSize = Math.round(size * BADGE_SIZE_RATIO);
  const badgeIconSize = Math.round(badgeSize * BADGE_ICON_SIZE_RATIO);
  const offset = Math.round(-(badgeSize / 2 - 4));

  return (
    <Box style={styles.container}>
      {statusIcon}
      <Box
        lx={{
          borderRadius: "full",
          borderWidth: "s1",
          borderColor: "mutedSubtle",
          backgroundColor: "base",
          alignItems: "center",
          justifyContent: "center",
        }}
        style={[
          styles.badge,
          { width: badgeSize, height: badgeSize, bottom: offset, right: offset },
        ]}
        accessible
        accessibilityLabel={t(mapTransactionTypeToTranslationKey[transactionType])}
      >
        <BadgeIcon
          width={badgeIconSize}
          height={badgeIconSize}
          color="base"
          strokeWidth={BADGE_ICON_STROKE_WIDTH}
        />
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  badge: {
    position: "absolute",
  },
});

const operationStatusIcon = {
  OUT: AleoOperationStatusIcon,
  IN: AleoOperationStatusIcon,
  FEES: AleoOperationStatusIcon,
  NONE: AleoOperationStatusIcon,
};

export default {
  OperationDetailsExtra,
  operationStatusIcon,
};
