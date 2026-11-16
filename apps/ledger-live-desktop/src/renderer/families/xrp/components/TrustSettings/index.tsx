import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Menu,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import { StepScreen } from "../StepScreen";
import { LabelWithInfo } from "../LabelWithInfo";
import type { TrustSettings } from "./useTrustSettings";

const RIPPLING_ACTIVATED = "activated";
const RIPPLING_DEACTIVATED = "deactivated";

function RowValue({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span className="flex items-center gap-4 body-2-semi-bold text-base">
      {children}
      <ChevronRight size={16} className="text-muted" />
    </span>
  );
}

export function TrustSettingsRows({ settings }: Readonly<{ settings: TrustSettings }>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <span className="body-2 text-muted">{t("xrp.manageAssets.balanceLimit")}</span>
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent p-0"
          onClick={settings.onOpenLimit}
          data-testid="xrp-trust-limit-row"
        >
          <RowValue>{settings.limitLabel}</RowValue>
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className="body-2 text-muted">
          <LabelWithInfo label={t("xrp.manageAssets.rippling")} info={t("xrp.rippling.warning")} />
        </span>
        <Menu>
          <MenuTrigger
            render={
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0"
                data-testid="xrp-trust-rippling-row"
              >
                <RowValue>
                  {settings.isRippling
                    ? t("xrp.manageAssets.activated")
                    : t("xrp.manageAssets.deactivated")}
                </RowValue>
              </button>
            }
          />
          <MenuContent className="pointer-events-auto w-256" align="end">
            <MenuRadioGroup
              value={settings.isRippling ? RIPPLING_ACTIVATED : RIPPLING_DEACTIVATED}
              onValueChange={value => settings.onChangeRippling(value === RIPPLING_ACTIVATED)}
            >
              <MenuRadioItem value={RIPPLING_DEACTIVATED} closeOnClick className="cursor-pointer">
                {t("xrp.manageAssets.deactivated")}
              </MenuRadioItem>
              <MenuRadioItem value={RIPPLING_ACTIVATED} closeOnClick className="cursor-pointer">
                {t("xrp.manageAssets.activated")}
              </MenuRadioItem>
            </MenuRadioGroup>
          </MenuContent>
        </Menu>
      </div>
    </div>
  );
}

export function LimitScreen({
  settings,
  isPending,
  onClose,
}: Readonly<{ settings: TrustSettings; isPending: boolean; onClose: () => void }>) {
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
        suffix={settings.unitCode}
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
        disabled={settings.hasLimitError || isPending}
        onClick={settings.onLimitConfirm}
        data-testid="xrp-trust-limit-confirm"
      >
        {t("common.confirm")}
      </Button>
    </StepScreen>
  );
}
