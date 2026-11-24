import React from "react";
import { useTranslation } from "react-i18next";
import {
  Menu,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
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
  const limitTitle = t("xrp.manageAssets.balanceLimit");
  const ripplingTitle = t("xrp.rippling.label");
  const ripplingValue = settings.isRippling
    ? t("xrp.manageAssets.activated")
    : t("xrp.manageAssets.deactivated");

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center justify-between py-2">
        <span className="body-2 text-muted">{limitTitle}</span>
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent p-0"
          onClick={settings.onOpenLimit}
          aria-label={`${limitTitle}: ${settings.limitLabel}`}
          data-testid="xrp-trust-limit-row"
        >
          <RowValue>{settings.limitLabel}</RowValue>
        </button>
      </div>
      <div className="flex items-center justify-between py-2">
        <span className="body-2 text-muted">
          <LabelWithInfo label={ripplingTitle} info={t("xrp.manageAssets.ripplingTooltip")} />
        </span>
        <Menu>
          <MenuTrigger
            render={
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0"
                aria-label={`${ripplingTitle}: ${ripplingValue}`}
                data-testid="xrp-trust-rippling-row"
              >
                <RowValue>{ripplingValue}</RowValue>
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
