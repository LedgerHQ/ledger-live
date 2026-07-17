import React from "react";
import { log } from "@ledgerhq/logs";
import { Linking } from "react-native";
import type { AdditionalProviderConfig } from "@ledgerhq/live-common/exchange/providers/swap";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Box, Pressable, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import CurrencyIcon from "~/components/CurrencyIcon";
import { useDetailsSectionViewModel } from "../../hooks/useDetailsSectionViewModel";
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
  const {
    networkFeesLabel,
    receiveAccountLabel,
    providerLabel,
    swapIdLabel,
    providerName,
    providerMainUrl,
    truncatedSwapId,
  } = useDetailsSectionViewModel({ provider, providerData, swapId });
  const receiveAccountValue = renderReceiveAccountValue({
    receiveAccountName,
    receiveAccountCurrency,
    testId: "swap-transaction-details-receive-account",
  });
  const providerRow = renderProviderRow({
    label: providerLabel,
    provider,
    providerName,
    providerMainUrl,
  });

  return (
    <Box lx={{ gap: "s12" }}>
      <DetailRow
        label={networkFeesLabel}
        value={feesAmount ?? <Skeleton lx={{ height: "s16", width: "s96" }} />}
        testId="swap-transaction-details-network-fees"
      />
      <DetailRow label={receiveAccountLabel} value={receiveAccountValue} />
      {providerRow}
      <DetailRow
        label={swapIdLabel}
        value={
          <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s6" }}>
            <Text
              testID="swap-transaction-details-swap-id"
              typography="body3SemiBold"
              lx={{ color: "base" }}
            >
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
  testId: string;
}>;

function renderReceiveAccountValue({
  receiveAccountName,
  receiveAccountCurrency,
  testId,
}: ReceiveAccountValueProps) {
  if (!receiveAccountName) {
    return <Skeleton lx={{ height: "s16", width: "s112" }} />;
  }

  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        gap: "s6",
        flexShrink: 1,
      }}
    >
      <Text
        testID={testId}
        typography="body3"
        lx={{ color: "base", textAlign: "right", flexShrink: 1 }}
      >
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
        testId: "swap-transaction-details-provider",
      })}
    />
  );
}

type ProviderValueRendererProps = Readonly<{
  provider: string;
  providerName: string;
  providerMainUrl?: string;
  testId: string;
}>;

function renderProviderValue({
  provider,
  providerName,
  providerMainUrl,
  testId,
}: ProviderValueRendererProps) {
  const providerValue = (
    <ProviderValue provider={provider} providerName={providerName} testId={testId} />
  );

  if (!providerMainUrl) {
    return providerValue;
  }

  return (
    <Pressable
      testID="swap-transaction-details-provider-link"
      onPress={() =>
        Linking.openURL(providerMainUrl).catch(error => {
          log("swap-transaction-status", "Failed to open provider URL", {
            error,
            url: providerMainUrl,
          });
        })
      }
      accessibilityRole="link"
      accessibilityLabel={providerName}
      accessibilityValue={{ text: providerMainUrl }}
    >
      {providerValue}
    </Pressable>
  );
}

type ProviderValueProps = Readonly<{
  provider: string;
  providerName: string;
  testId: string;
}>;

function ProviderValue({ provider, providerName, testId }: ProviderValueProps) {
  return (
    <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s6" }}>
      <Text testID={testId} typography="body3SemiBold" lx={{ color: "base", textAlign: "right" }}>
        {providerName}
      </Text>
      <ProviderIcon name={provider} />
    </Box>
  );
}
