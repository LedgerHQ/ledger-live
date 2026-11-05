import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { PaySuccessSummaryIcon, PaySuccessSummaryRow } from "./PaySuccessSummary";

type UsePaySuccessSummaryRowsParams = Readonly<{
  amountFormatted: string;
  estimatedTime?: string;
  fromAccountName?: string;
  networkIcon?: PaySuccessSummaryIcon;
}>;

export function usePaySuccessSummaryRows({
  amountFormatted,
  estimatedTime,
  fromAccountName,
  networkIcon,
}: UsePaySuccessSummaryRowsParams): ReadonlyArray<PaySuccessSummaryRow> {
  const { t } = useTranslation();

  return useMemo(() => {
    if (fromAccountName === undefined) {
      return [];
    }

    return [
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
  }, [amountFormatted, estimatedTime, fromAccountName, networkIcon, t]);
}
