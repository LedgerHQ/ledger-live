import React from "react";
import { useTranslation } from "react-i18next";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider, InfoState } from "@shared/ui-info-state";
import type { PerpsTransactionSignedViewModel } from "./usePerpsTransactionSignedViewModel";

export function PerpsTransactionSignedView({
  receiveCurrencyTicker,
  handleViewTransaction,
  handleClose,
}: Readonly<PerpsTransactionSignedViewModel>) {
  const { t } = useTranslation();

  return (
    <DialogBackgroundToneProvider>
      <DialogHeader density="compact" onClose={handleClose} className="!mb-0" />
      <DialogBody className="!mb-0 flex min-h-0 flex-col px-24 pb-24">
        <InfoState
          preset="success"
          size="hug"
          title={t("perpsTransactionSigned.title")}
          description={t("perpsTransactionSigned.description", { currency: receiveCurrencyTicker })}
          primaryCta={{
            label: t("perpsTransactionSigned.viewTransaction"),
            onPress: handleViewTransaction,
            testID: "perps-transaction-signed-cta",
          }}
        />
      </DialogBody>
    </DialogBackgroundToneProvider>
  );
}
