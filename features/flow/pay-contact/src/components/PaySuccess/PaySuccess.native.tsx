import React from "react";
import { Button, Box, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { PaySuccessHero, type PaySuccessRecipient } from "./PaySuccessHero.native";
import {
  PaySuccessSummary,
  type PaySuccessSummaryIcon,
  type PaySuccessSummaryRow,
} from "./PaySuccessSummary.native";

export type { PaySuccessRecipient };

export type PaySuccessProps = Readonly<{
  recipient?: PaySuccessRecipient;
  recipientLabel: string;
  amountFormatted: string;
  fromAccountName?: string;
  networkIcon?: PaySuccessSummaryIcon;
  estimatedTime?: string;
  canViewTransaction: boolean;
  onViewTransaction: () => void;
  onClose: () => void;
}>;

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

  const rows: ReadonlyArray<PaySuccessSummaryRow> = fromAccountName
    ? [
        { id: "amount", label: t("payTab.contacts.paySuccess.amount"), value: amountFormatted },
        ...(estimatedTime
          ? [
              {
                id: "estimatedTime",
                label: t("payTab.contacts.paySuccess.estimatedTime"),
                value: estimatedTime,
              },
            ]
          : []),
        {
          id: "from",
          label: t("payTab.contacts.paySuccess.from"),
          value: fromAccountName,
          trailingIcon: networkIcon,
        },
      ]
    : [];

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
      <Box
        lx={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: "s32",
        }}
      >
        <PaySuccessHero
          recipient={recipient}
          recipientLabel={recipientLabel}
          amountFormatted={amountFormatted}
        />
        {rows.length > 0 ? <PaySuccessSummary rows={rows} /> : null}
      </Box>
      <Box lx={{ gap: "s16" }}>
        {canViewTransaction ? (
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
