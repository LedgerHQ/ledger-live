import { useMemo } from "react";
import type { ContactsNativeProps } from "@features/flow-pay-contact";
import { useTranslation } from "~/context/Locale";
import { usePayTabNewPayment } from "./usePayTabNewPayment";

export function usePayTabContacts(): ContactsNativeProps {
  const { t } = useTranslation();
  const { open } = usePayTabNewPayment();

  return useMemo(
    () => ({
      title: t("payTab.contacts.title"),
      payLabel: t("payTab.contacts.pay"),
      onPay: open,
    }),
    [t, open],
  );
}
