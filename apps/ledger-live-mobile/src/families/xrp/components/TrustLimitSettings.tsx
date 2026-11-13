import React from "react";
import type BigNumber from "bignumber.js";
import {
  AmountInput,
  Box,
  Divider,
  InteractiveIcon,
  Switch,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { IconBox, IconsLegacy } from "@ledgerhq/native-ui";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { TokenCurrency } from "@domain/entity-currency-token";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { Trans, useTranslation } from "~/context/Locale";
import { FullTextBanner } from "./FullTextBanner";
import InfoModal from "~/modals/Info";

function InfoIcon() {
  return <IconBox Icon={IconsLegacy.InfoMedium} color="primary.c80" boxSize={64} iconSize={24} />;
}

function SwitchRow({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Box lx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      {children}
    </Box>
  );
}

export function TrustLimitInput({
  token,
  limitText,
  isMaximum,
  isInvalid,
  onChangeLimitText,
}: Readonly<{
  token: TokenCurrency;
  limitText: string;
  isMaximum: boolean;
  isInvalid: boolean;
  onChangeLimitText: (text: string) => void;
}>) {
  const { t } = useTranslation();

  return (
    <Box lx={{ alignItems: "center", gap: "s8", paddingTop: "s8" }}>
      <Text typography="body2" lx={{ color: "muted" }}>
        {t("xrp.tokenSettings.limit")}
      </Text>
      <AmountInput
        value={limitText}
        onChangeText={onChangeLimitText}
        currencyText={token.ticker}
        currencyPosition="right"
        maxIntegerLength={16}
        disabled={isMaximum}
        isInvalid={isInvalid}
        testID="xrp-limit-input"
      />
      {isInvalid ? (
        <Text typography="body3" lx={{ color: "error" }}>
          {t("xrp.addToken.errors.limitZero")}
        </Text>
      ) : null}
    </Box>
  );
}

/** The max limit and rippling switches, with `children` as extra rows under them */
export function TrustLimitControls({
  isMaximum,
  isRippling,
  onChangeUseMax,
  onChangeRippling,
  onOpenMaxLimitInfo,
  children,
}: Readonly<{
  isMaximum: boolean;
  isRippling: boolean;
  onChangeUseMax: (useMax: boolean) => void;
  onChangeRippling: (isRippling: boolean) => void;
  onOpenMaxLimitInfo: () => void;
  children?: React.ReactNode;
}>) {
  const { t } = useTranslation();
  const maxLimitLabel = t("xrp.tokenSettings.maxLimit");
  const ripplingLabel = t("xrp.rippling.label");

  return (
    <Box lx={{ gap: "s12" }}>
      <Divider />
      <SwitchRow>
        <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
          <Text typography="body2" lx={{ color: "base" }}>
            {maxLimitLabel}
          </Text>
          <InteractiveIcon
            icon={Information}
            size={16}
            iconType="stroked"
            accessibilityLabel={maxLimitLabel}
            onPress={onOpenMaxLimitInfo}
            testID="xrp-max-limit-info"
          />
        </Box>
        <Switch
          checked={isMaximum}
          onCheckedChange={onChangeUseMax}
          accessibilityLabel={maxLimitLabel}
          testID="xrp-limit-max-switch"
        />
      </SwitchRow>
      <SwitchRow>
        <Text typography="body2" lx={{ color: "base" }}>
          {ripplingLabel}
        </Text>
        <Switch
          checked={isRippling}
          onCheckedChange={onChangeRippling}
          accessibilityLabel={ripplingLabel}
          testID="xrp-rippling-switch"
        />
      </SwitchRow>
      {isRippling ? (
        <FullTextBanner
          appearance="warning"
          description={t("xrp.rippling.warning")}
          testID="xrp-rippling-warning"
        />
      ) : null}
      {children}
    </Box>
  );
}

export function RipplingInfoModal(modal: Readonly<{ isOpened: boolean; onClose: () => void }>) {
  const { t } = useTranslation();

  return (
    <InfoModal
      isOpened={modal.isOpened}
      onClose={modal.onClose}
      data={[
        {
          Icon: InfoIcon,
          title: t("xrp.rippling.label"),
          description: t("xrp.rippling.warning"),
        },
      ]}
    />
  );
}

export function MaxLimitInfoModal({
  token,
  maxLimit,
  isOpened,
  onClose,
}: Readonly<{
  token: TokenCurrency;
  maxLimit: BigNumber;
  isOpened: boolean;
  onClose: () => void;
}>) {
  const { t } = useTranslation();

  return (
    <InfoModal
      isOpened={isOpened}
      onClose={onClose}
      data={[
        {
          Icon: InfoIcon,
          title: t("xrp.tokenSettings.maxLimit"),
          description: (
            <Trans
              i18nKey="xrp.tokenSettings.maxLimitInfo"
              values={{ token: token.ticker }}
              components={{
                amount: <CurrencyUnitValue unit={token.units[0]} value={maxLimit} showCode />,
              }}
            />
          ),
        },
      ]}
    />
  );
}
