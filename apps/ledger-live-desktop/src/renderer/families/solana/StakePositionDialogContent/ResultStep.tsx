import React from "react";
import { useTranslation } from "react-i18next";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import { InfoState } from "@shared/ui-info-state";
import type { StakePositionExitAction } from "@features/flow-stake-position";
import TranslatedError from "~/renderer/components/TranslatedError";

export type ResultStepProps =
  | Readonly<{
      kind: "success";
      action: StakePositionExitAction;
      onViewDetails?: () => void;
      onClose: () => void;
    }>
  | Readonly<{
      kind: "failure";
      error: Error;
      isSigned: boolean;
      onRetry: () => void;
      onClose: () => void;
    }>;

const SUCCESS_TITLE_KEYS = {
  deactivate: "stakePosition.result.deactivateTitle",
  withdraw: "stakePosition.result.withdrawTitle",
} as const satisfies Record<StakePositionExitAction, string>;

export function ResultStep(props: ResultStepProps) {
  const { t } = useTranslation();
  const closeCta = { label: t("stakePosition.result.close"), onPress: props.onClose };

  if (props.kind === "success") {
    return (
      <DialogBody>
        <InfoState
          preset="success"
          size="hug"
          title={t(SUCCESS_TITLE_KEYS[props.action])}
          description={t("stakePosition.result.description")}
          primaryCta={
            props.onViewDetails
              ? { label: t("stakePosition.result.viewDetails"), onPress: props.onViewDetails }
              : undefined
          }
          secondaryCta={closeCta}
          testID="stake-position-success"
        />
      </DialogBody>
    );
  }

  return (
    <DialogBody>
      <InfoState
        preset="error"
        size="hug"
        title={<TranslatedError error={props.error} field="title" />}
        description={<TranslatedError error={props.error} field="description" />}
        banner={
          props.isSigned
            ? { title: t("solana.common.broadcastError"), appearance: "warning" }
            : undefined
        }
        primaryCta={{ label: t("stakePosition.result.retry"), onPress: props.onRetry }}
        secondaryCta={closeCta}
        testID="stake-position-failure"
      />
    </DialogBody>
  );
}
