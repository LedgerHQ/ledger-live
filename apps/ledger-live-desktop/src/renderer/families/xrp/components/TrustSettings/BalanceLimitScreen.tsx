import React from "react";
import { useTranslation } from "react-i18next";
import { Button, TextInput } from "@ledgerhq/lumen-ui-react";
import { StepScreen } from "../StepScreen";
import type { TrustSettings } from "./useTrustSettings";

type Props = Readonly<{
  settings: TrustSettings;
  onClose: () => void;
}>;

export function BalanceLimitScreen({ settings, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <StepScreen
      title={t("xrp.manageAssets.balanceLimit")}
      description={t("xrp.manageAssets.editAsset.limitDescription")}
      onBack={settings.onLimitBack}
      onClose={onClose}
    >
      <TextInput
        label={t("xrp.manageAssets.balanceLimit")}
        value={settings.limitText}
        onChange={event => settings.onChangeLimitText(event.target.value)}
        onClear={() => settings.onChangeLimitText("")}
        suffix={<span className="shrink-0 body-1 text-muted">{settings.unitCode}</span>}
        status={settings.limitErrorText ? "error" : undefined}
        helperText={settings.limitErrorText}
        inputMode="decimal"
        data-testid="xrp-trust-limit-input"
      />
      <div className="flex">
        <Button appearance="gray" size="sm" onClick={settings.onSetMaxLimit}>
          {t("xrp.manageAssets.editAsset.setMax")}
        </Button>
      </div>
      <Button
        appearance="base"
        size="lg"
        isFull
        loading={settings.bridgePending}
        disabled={settings.isLimitConfirmDisabled}
        onClick={settings.onLimitConfirm}
        data-testid="xrp-trust-limit-confirm"
      >
        {t("common.confirm")}
      </Button>
    </StepScreen>
  );
}
