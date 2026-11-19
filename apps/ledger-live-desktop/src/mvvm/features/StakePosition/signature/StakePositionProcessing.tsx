import React from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@ledgerhq/lumen-ui-react";

/** The device or the network works on the exit transaction. */
export function StakePositionProcessing({ testID }: Readonly<{ testID?: string }>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-16 py-24" data-testid={testID}>
      <Spinner size={40} />
      <p className="body-2 text-muted">{t("stakePosition.signature.processing")}</p>
    </div>
  );
}
