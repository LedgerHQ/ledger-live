import React from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import type { StakePositionExitAction } from "@features/flow-stake-position";

const TITLE_KEYS = {
  deactivate: "stakePosition.signature.processingTitle.deactivate",
  withdraw: "stakePosition.signature.processingTitle.withdraw",
} as const satisfies Record<StakePositionExitAction, string>;

type StakePositionProcessingProps = Readonly<{
  action: StakePositionExitAction;
  testID?: string;
}>;

/** The device or the network works on the exit transaction. */
export function StakePositionProcessing({ action, testID }: StakePositionProcessingProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-16 py-24" data-testid={testID}>
      <Spinner size={40} />
      <div className="flex flex-col items-center gap-4 text-center">
        <h3 className="heading-4-semi-bold text-base">{t(TITLE_KEYS[action])}</h3>
        <p className="body-2 text-muted">{t("stakePosition.signature.processing")}</p>
      </div>
    </div>
  );
}
