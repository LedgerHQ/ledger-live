import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import { ConfirmationScreenView } from "LLM/features/Send/screens/Confirmation/components/ConfirmationScreenView";

export default function DebugSendSuccess() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const onClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <ConfirmationScreenView
      title={t("send.newSendFlow.transactionSigned")}
      description={t("send.newSendFlow.processingTransaction")}
      viewTransactionLabel={t("send.newSendFlow.confirmation.viewTransaction")}
      closeLabel={t("common.close")}
      canViewTransaction={false}
      trackingProperties={{ flow: "send", source: "devtools" }}
      onViewTransaction={() => undefined}
      onClose={onClose}
    />
  );
}
