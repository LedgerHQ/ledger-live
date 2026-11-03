import React from "react";
import { Button, Box, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import type { PaySuccessProps } from "./PaySuccess.types";
import { PaySuccessHero } from "./PaySuccessHero";
import { PaySuccessSummary } from "./PaySuccessSummary";
import { usePaySuccessSummaryRows } from "./usePaySuccessSummaryRows";

export function PaySuccess({
  recipient,
  recipientLabel,
  amountFormatted,
  fromAccountName,
  networkIcon,
  estimatedTime,
  canViewTransaction,
  onViewTransaction,
  onClose,
}: PaySuccessProps) {
  const { t } = useTranslation();
  const rows = usePaySuccessSummaryRows({
    amountFormatted,
    estimatedTime,
    fromAccountName,
    networkIcon,
  });

  return (
    <Box
      lx={{
        flex: 1,
        backgroundColor: "base",
        paddingHorizontal: "s16",
        paddingVertical: "s24",
      }}
      testID="pay-success-step"
    >
      <Box lx={{ alignItems: "flex-start" }}>
        <IconButton
          icon={Close}
          appearance="no-background"
          size="md"
          onPress={onClose}
          accessibilityLabel={t("payTab.contacts.paySuccess.close")}
          testID="pay-success-header-close"
        />
      </Box>
      <Box lx={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <PaySuccessHero
          recipient={recipient}
          recipientLabel={recipientLabel}
          amountFormatted={amountFormatted}
        />
      </Box>
      {rows.length > 0 ? (
        <Box lx={{ width: "full", paddingBottom: "s24" }}>
          <PaySuccessSummary rows={rows} />
        </Box>
      ) : null}
      <Box lx={{ gap: "s16" }}>
        {canViewTransaction !== false ? (
          <Button
            appearance="gray"
            size="lg"
            lx={{ width: "full" }}
            onPress={onViewTransaction}
            testID="pay-success-view-transaction"
          >
            {t("payTab.contacts.paySuccess.viewTransaction")}
          </Button>
        ) : null}
        <Button
          appearance="base"
          size="lg"
          lx={{ width: "full" }}
          onPress={onClose}
          testID="pay-success-close"
        >
          {t("payTab.contacts.paySuccess.close")}
        </Button>
      </Box>
    </Box>
  );
}
