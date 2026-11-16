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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight, Information } from "@ledgerhq/lumen-ui-react/symbols";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { SignatureSteps } from "../Signature";
import { StepScreen } from "../StepScreen";
import { useEditAssetViewModel } from "./useEditAssetViewModel";

const RIPPLING_ACTIVATED = "activated";
const RIPPLING_DEACTIVATED = "deactivated";

type Props = Readonly<{
  account: Account;
  tokenAccount: TokenAccount;
  onBackToList: () => void;
  onClose: () => void;
}>;

function RowValue({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span className="flex items-center gap-4 body-2-semi-bold text-base">
      {children}
      <ChevronRight size={16} className="text-muted" />
    </span>
  );
}

export function EditAsset({ account, tokenAccount, onBackToList, onClose }: Props) {
  const { t } = useTranslation();
  const viewModel = useEditAssetViewModel(account, tokenAccount);
  const { token } = tokenAccount;
  const ripplingLabel = t("xrp.manageAssets.rippling");

  if (viewModel.signature.phase !== "idle") {
    return (
      <SignatureSteps
        signature={viewModel.signature}
        successTitle={t("xrp.manageAssets.editAsset.success", { token: token.name })}
        onClose={onClose}
      />
    );
  }

  if (viewModel.isLimitStep) {
    return (
      <StepScreen
        title={t("xrp.manageAssets.balanceLimit")}
        description={t("xrp.manageAssets.editAsset.limitDescription")}
        onBack={viewModel.onLimitBack}
        onClose={onClose}
      >
        <TextInput
          label={t("xrp.manageAssets.balanceLimit")}
          value={viewModel.limitText}
          onChange={event => viewModel.onChangeLimitText(event.target.value)}
          onClear={() => viewModel.onChangeLimitText("")}
          suffix={viewModel.unitCode}
          status={viewModel.limitErrorText ? "error" : undefined}
          helperText={viewModel.limitErrorText}
          inputMode="decimal"
          data-testid="xrp-edit-asset-limit-input"
        />
        <div className="flex">
          <Button appearance="gray" size="sm" onClick={viewModel.onSetMaxLimit}>
            {t("xrp.manageAssets.editAsset.setMax")}
          </Button>
        </div>
        <Button
          appearance="base"
          size="lg"
          isFull
          disabled={viewModel.isLimitConfirmDisabled}
          onClick={viewModel.onLimitConfirm}
          data-testid="xrp-edit-asset-limit-confirm"
        >
          {t("common.confirm")}
        </Button>
      </StepScreen>
    );
  }

  return (
    <StepScreen
      title={t("xrp.manageAssets.editAsset.title")}
      onBack={onBackToList}
      onClose={onClose}
    >
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <span className="body-2 text-muted">{t("xrp.manageAssets.balanceLimit")}</span>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0"
            onClick={viewModel.onOpenLimit}
            data-testid="xrp-edit-asset-limit-row"
          >
            <RowValue>{viewModel.limitLabel}</RowValue>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-4 body-2 text-muted">
            {ripplingLabel}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={ripplingLabel}
                  className="inline-flex cursor-help border-0 bg-transparent p-0"
                >
                  <Information size={16} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("xrp.rippling.warning")}</TooltipContent>
            </Tooltip>
          </span>
          <Menu>
            <MenuTrigger
              render={
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0"
                  data-testid="xrp-edit-asset-rippling-row"
                >
                  <RowValue>
                    {viewModel.isRippling
                      ? t("xrp.manageAssets.activated")
                      : t("xrp.manageAssets.deactivated")}
                  </RowValue>
                </button>
              }
            />
            <MenuContent className="pointer-events-auto w-256" align="end">
              <MenuRadioGroup
                value={viewModel.isRippling ? RIPPLING_ACTIVATED : RIPPLING_DEACTIVATED}
                onValueChange={value => viewModel.onChangeRippling(value === RIPPLING_ACTIVATED)}
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
      <Button
        appearance="base"
        size="lg"
        isFull
        disabled={viewModel.isContinueDisabled}
        onClick={viewModel.signature.onStart}
        data-testid="xrp-edit-asset-continue"
      >
        {t("common.continue")}
      </Button>
    </StepScreen>
  );
}
