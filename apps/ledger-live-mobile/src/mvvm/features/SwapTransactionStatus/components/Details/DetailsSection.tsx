import React from "react";
import { Linking } from "react-native";
import { getSwapTransactionStatusDetailsViewModel } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { AdditionalProviderConfig } from "@ledgerhq/live-common/exchange/providers/swap";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Box, Pressable, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import CurrencyIcon from "~/components/CurrencyIcon";
import { useTranslation } from "~/context/Locale";
import { CopyIconButton } from "./CopyIconButton";
import { DetailRow } from "./DetailRow";
import { ProviderIcon } from "./ProviderIcon";

type DetailsSectionProps = Readonly<{
  feesAmount?: string;
  receiveAccountName?: string;
  receiveAccountCurrency?: CryptoCurrency;
  provider?: string;
  providerData?: AdditionalProviderConfig;
  swapId: string;
}>;

export function DetailsSection({
  feesAmount,
  receiveAccountName,
  receiveAccountCurrency,
  provider,
  providerData,
  swapId,
}: DetailsSectionProps) {
  const { t } = useTranslation();
  const { providerName, providerMainUrl, truncatedSwapId } =
    getSwapTransactionStatusDetailsViewModel({
      provider,
      providerData,
      swapId,
    });
  const receiveAccountValue = renderReceiveAccountValue({
    receiveAccountName,
    receiveAccountCurrency,
  });
  const providerRow = renderProviderRow({
    label: t("transfer.swap2.modals.transactionStatus.sections.details.provider"),
    provider,
    providerName,
    providerMainUrl,
  });

  return (
    <Box lx={{ gap: "s12" }}>
      <DetailRow
        label={t("transfer.swap2.modals.transactionStatus.sections.details.networkFees")}
        value={feesAmount ?? <Skeleton lx={{ height: "s16", width: "s96" }} />}
      />
      <DetailRow
        label={t("transfer.swap2.modals.transactionStatus.sections.details.receiveAccount")}
        value={receiveAccountValue}
      />
      {providerRow}
      <DetailRow
        label={t("transfer.swap2.modals.transactionStatus.sections.details.swapId")}
        value={
          <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s6" }}>
            <Text typography="body3SemiBold" lx={{ color: "base" }}>
              {truncatedSwapId}
            </Text>
            <CopyIconButton text={swapId} />
          </Box>
        }
      />
    </Box>
  );
}

type ReceiveAccountValueProps = Readonly<{
  receiveAccountName?: string;
  receiveAccountCurrency?: CryptoCurrency;
}>;

function renderReceiveAccountValue({
  receiveAccountName,
  receiveAccountCurrency,
}: ReceiveAccountValueProps) {
  if (!receiveAccountName) {
    return <Skeleton lx={{ height: "s16", width: "s112" }} />;
  }

  return (
    <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s6", flexShrink: 1 }}>
      <Text typography="body3" lx={{ color: "base", textAlign: "right", flexShrink: 1 }}>
        {receiveAccountName}
      </Text>
      {receiveAccountCurrency ? (
        <CurrencyIcon currency={receiveAccountCurrency} size={16} squared />
      ) : null}
    </Box>
  );
}

type ProviderRowProps = Readonly<{
  label: string;
  provider?: string;
  providerName?: string;
  providerMainUrl?: string;
}>;

function renderProviderRow({ label, provider, providerName, providerMainUrl }: ProviderRowProps) {
  if (!provider || !providerName) {
    return null;
  }

  return (
    <DetailRow
      label={label}
      value={renderProviderValue({
        provider,
        providerName,
        providerMainUrl,
      })}
    />
  );
}

type ProviderValueRendererProps = Readonly<{
  provider: string;
  providerName: string;
  providerMainUrl?: string;
}>;

function renderProviderValue({
  provider,
  providerName,
  providerMainUrl,
}: ProviderValueRendererProps) {
  const providerValue = <ProviderValue provider={provider} providerName={providerName} />;

  if (!providerMainUrl) {
    return providerValue;
  }

  return (
    <Pressable
      onPress={() => Linking.openURL(providerMainUrl).catch(() => {})}
      accessibilityRole="link"
    >
      {providerValue}
    </Pressable>
  );
}

type ProviderValueProps = Readonly<{
  provider: string;
  providerName: string;
}>;

function ProviderValue({ provider, providerName }: ProviderValueProps) {
  return (
    <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s6" }}>
      <Text typography="body3SemiBold" lx={{ color: "base", textAlign: "right" }}>
        {providerName}
      </Text>
      <ProviderIcon name={provider} />
    </Box>
  );
}
