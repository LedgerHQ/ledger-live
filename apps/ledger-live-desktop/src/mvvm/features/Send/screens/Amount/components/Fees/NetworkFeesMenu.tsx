import React from "react";
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuGroup,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuItem,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@ledgerhq/lumen-ui-react";
import { ChevronDown, ChevronUpDown, Information, Check } from "@ledgerhq/lumen-ui-react/symbols";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { useTranslation } from "react-i18next";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { FeeSelectorOption, SponsoredFeeDisplay } from "../../types";
import { SponsoredFeeNudge, type SponsoredFeeNudgeProps } from "./SponsoredFeeNudge";

type FeesDisplay = Readonly<{
  label: string;
  value: string;
  /** Native fee amount shown after `value`, set only when fees are read-only. */
  secondaryValue: string | null;
  strategyLabel: string;
}>;

type FeesSelector = Readonly<{
  options: readonly FeeSelectorOption[];
  selectedId: string;
  canOpen: boolean;
}>;

type NetworkFeesMenuProps = Readonly<{
  display: FeesDisplay;
  feeSelector: FeesSelector;
  sponsoredNudge?: SponsoredFeeNudgeProps;
  sponsoredFee?: SponsoredFeeDisplay | null;
}>;

function SponsoredFeeValue({ fee }: Readonly<{ fee: SponsoredFeeDisplay }>) {
  return (
    <span className="flex items-center gap-4">
      {fee.feeAsset ? (
        <CryptoIcon ledgerId={fee.feeAsset.ledgerId} ticker={fee.feeAsset.ticker} size={16} />
      ) : null}
      {fee.originalValue ? (
        <span
          className="body-3 text-muted line-through"
          data-testid="send-sponsored-fee-original-value"
        >
          {fee.originalValue}
        </span>
      ) : null}
      <span className="body-3 text-base" data-testid="send-sponsored-fee-value">
        {fee.value}
      </span>
    </span>
  );
}

type FeesValueRowProps = Readonly<{
  label: string;
  informationIcon: React.ReactNode;
  value: string;
  secondaryValue: string | null;
  sponsoredNudge?: SponsoredFeeNudgeProps;
  sponsoredFee?: SponsoredFeeDisplay | null;
}>;

function FeesValueRow({
  label,
  informationIcon,
  value,
  secondaryValue,
  sponsoredNudge,
  sponsoredFee,
}: FeesValueRowProps) {
  const feeValue = sponsoredFee ? (
    <SponsoredFeeValue fee={sponsoredFee} />
  ) : (
    <span className="flex items-center gap-4">
      <span className="body-3 text-base">{value}</span>
      {secondaryValue ? <span className="body-3 text-muted">{secondaryValue}</span> : null}
    </span>
  );

  return (
    <div
      className="flex w-full items-center justify-between mt-8 mb-12"
      data-testid="send-network-fees-row"
    >
      <span className="flex items-center gap-8">
        <span className="body-3">{label}</span>
        {informationIcon}
      </span>
      {sponsoredNudge?.available ? (
        <button
          type="button"
          onClick={sponsoredNudge.onOpen}
          className="flex flex-col items-end gap-4 transition-colors hover:opacity-70 cursor-pointer"
          data-testid="send-fee-payment-entry"
        >
          <SponsoredFeeNudge {...sponsoredNudge} />
          <span className="flex items-center gap-4">
            {feeValue}
            <ChevronDown size={16} className="text-muted" />
          </span>
        </button>
      ) : (
        feeValue
      )}
    </div>
  );
}

export function NetworkFeesMenu({
  display,
  feeSelector,
  sponsoredNudge,
  sponsoredFee,
}: NetworkFeesMenuProps) {
  const {
    label: feesLabel,
    value: feesValue,
    secondaryValue: feesSecondaryValue,
    strategyLabel: feesStrategyLabel,
  } = display;
  const { options, selectedId, canOpen } = feeSelector;
  const { t } = useTranslation();
  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;
  const { transaction, status } = state.transaction;

  if (!account || !transaction) {
    return null;
  }

  const mainAccount = getMainAccount(account, parentAccount ?? undefined);
  const currency = getAccountCurrency(mainAccount);

  const strategyOptions = options.filter(
    option => option.kind === "preset" || option.kind === "default",
  );
  const customOption = options.find(option => option.kind === "custom");
  const coinControlOption = options.find(option => option.kind === "coinControl");

  const networkFeesInfo = sendFeatures.getNetworkFeesInfo(currency, { transaction, status });
  const networkFeesDescription = networkFeesInfo
    ? t(`newSendFlow.${networkFeesInfo.translationKey}.description`, networkFeesInfo.values)
    : t("newSendFlow.feesPaid");

  const informationIcon = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Information size={16} className="text-muted" />
      </TooltipTrigger>
      <TooltipContent>
        <p>{sponsoredFee ? sponsoredFee.description : networkFeesDescription}</p>
      </TooltipContent>
    </Tooltip>
  );

  // A sponsored fee is priced by its provider, so the strategy presets don't apply to it; while
  // one is offered, the fee value opens the fee payment step instead of the strategy menu.
  if (!canOpen || sponsoredFee || sponsoredNudge?.available) {
    return (
      <FeesValueRow
        label={feesLabel}
        informationIcon={informationIcon}
        value={feesValue}
        secondaryValue={feesSecondaryValue}
        sponsoredNudge={sponsoredNudge}
        sponsoredFee={sponsoredFee}
      />
    );
  }

  return (
    <div
      className="flex w-full items-center justify-between mt-16 mb-12"
      data-testid="send-network-fees-row"
    >
      <span className="flex items-center gap-8">
        <span className="body-3">{feesLabel}</span>
        {informationIcon}
      </span>
      <Menu>
        <MenuTrigger
          render={
            <button
              type="button"
              className="flex items-center gap-8 transition-colors hover:opacity-70  cursor-pointer"
              data-testid="send-network-fees-menu-trigger"
            >
              <span className="body-3 text-base">
                {feesValue} • {feesStrategyLabel}
              </span>
              <ChevronUpDown size={16} className="text-muted" />
            </button>
          }
        />
        <MenuContent className="pointer-events-auto w-256" side="top">
          <MenuGroup>
            <MenuLabel>{feesLabel}</MenuLabel>
            {strategyOptions.length > 0 ? (
              <MenuRadioGroup
                value={selectedId}
                onValueChange={id => {
                  const option = options.find(o => o.id === id);
                  option?.onSelect();
                }}
              >
                {strategyOptions.map(option => (
                  <MenuRadioItem
                    key={option.id}
                    value={option.id}
                    closeOnClick
                    className="cursor-pointer"
                    data-testid={`send-fees-preset-${option.id}`}
                  >
                    <div className="flex flex-col">
                      <span className="text-base">{option.label}</span>
                      {option.sublabel ? (
                        <span className="body-3 text-muted">{option.sublabel}</span>
                      ) : null}
                    </div>
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            ) : null}
            {strategyOptions.length > 0 && (customOption || coinControlOption) ? (
              <MenuSeparator />
            ) : null}
            {customOption ? (
              <MenuItem
                className="cursor-pointer"
                data-testid="send-custom-fees-menu-item"
                onClick={() => {
                  customOption.onSelect();
                }}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-base">{customOption.label}</span>
                  {customOption.selected ? <Check size={16} /> : null}
                </div>
              </MenuItem>
            ) : null}
            {coinControlOption ? (
              <MenuItem
                className="cursor-pointer"
                data-testid="send-coin-control-fees-menu-item"
                onClick={() => {
                  coinControlOption.onSelect();
                }}
              >
                {coinControlOption.label}
              </MenuItem>
            ) : null}
          </MenuGroup>
        </MenuContent>
      </Menu>
    </div>
  );
}
