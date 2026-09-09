import React from "react";
import { Button, Box } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { PaySuccessHero, type PaySuccessRecipient } from "./PaySuccessHero.native";
import {
  PaySuccessSummary,
  type PaySuccessSummaryIcon,
  type PaySuccessSummaryRow,
} from "./PaySuccessSummary.native";

export type PaySuccessProps = Readonly<{
  recipient?: PaySuccessRecipient;
  recipientLabel: string;
  amountFormatted: string;
  fromAccountName: string;
  networkIcon?: PaySuccessSummaryIcon;
  estimatedTime?: string;
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
  onViewTransaction,
  onClose,
}: PaySuccessProps) {
  const { t } = useTranslation();

  const rows: ReadonlyArray<PaySuccessSummaryRow> = [
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
  ];

  return (
    <Box
      lx={{ flex: 1, paddingHorizontal: "s16", paddingVertical: "s24" }}
      testID="pay-success-step"
    >
      <Box lx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "s32" }}>
        <PaySuccessHero
          recipient={recipient}
          recipientLabel={recipientLabel}
          amountFormatted={amountFormatted}
        />
        <PaySuccessSummary rows={rows} />
      </Box>
      <Box lx={{ gap: "s16" }}>
        <Button
          appearance="gray"
          size="lg"
          lx={{ width: "full" }}
          onPress={onViewTransaction}
          testID="pay-success-view-transaction"
        >
          {t("payTab.contacts.paySuccess.viewTransaction")}
        </Button>
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
