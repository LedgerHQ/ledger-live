import React from "react";
import { Linking } from "react-native";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import type { AdditionalProviderConfig } from "@ledgerhq/live-common/exchange/providers/swap";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Box, Pressable, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import CurrencyIcon from "~/components/CurrencyIcon";
import { useTranslation } from "~/context/Locale";
import { CopyIconButton } from "./CopyIconButton";
import { DetailRow } from "./DetailRow";
import { ProviderIcon } from "./ProviderIcon";
import { truncateMiddle } from "../utils";

type DetailsSectionProps = {
  feesAmount?: string;
  receiveAccountName?: string;
  provider?: string;
  providerData?: AdditionalProviderConfig;
  receiveCurrency?: CryptoOrTokenCurrency;
  swapId: string;
};

export function DetailsSection({
  feesAmount,
  receiveAccountName,
  provider,
  providerData,
  receiveCurrency,
  swapId,
}: DetailsSectionProps) {
  const { t } = useTranslation();
  const providerName = provider ? getProviderName(provider) : undefined;

  return (
    <Box lx={{ gap: "s12" }}>
      <DetailRow
        label={t("transfer.swap2.modals.transactionStatus.sections.details.networkFees")}
        value={feesAmount ?? <Skeleton lx={{ height: "s16", width: "s96" }} />}
      />
      <DetailRow
        label={t("transfer.swap2.modals.transactionStatus.sections.details.receiveAccount")}
        value={
          receiveAccountName ? (
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s6", flexShrink: 1 }}>
              <Text typography="body3" lx={{ color: "base", textAlign: "right", flexShrink: 1 }}>
                {receiveAccountName}
              </Text>
              {receiveCurrency ? <CurrencyIcon currency={receiveCurrency} size={16} /> : null}
            </Box>
          ) : (
            <Skeleton lx={{ height: "s16", width: "s112" }} />
          )
        }
      />
      {provider && providerName ? (
        <DetailRow
          label={t("transfer.swap2.modals.transactionStatus.sections.details.provider")}
          value={
            providerData?.mainUrl ? (
              <Pressable
                onPress={() => Linking.openURL(providerData.mainUrl!).catch(() => {})}
                accessibilityRole="link"
              >
                <ProviderValue provider={provider} providerName={providerName} />
              </Pressable>
            ) : (
              <ProviderValue provider={provider} providerName={providerName} />
            )
          }
        />
      ) : null}
      <DetailRow
        label={t("transfer.swap2.modals.transactionStatus.sections.details.swapId")}
        value={
          <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s6" }}>
            <Text typography="body3SemiBold" lx={{ color: "base" }}>
              {truncateMiddle(swapId)}
            </Text>
            <CopyIconButton text={swapId} />
          </Box>
        }
      />
    </Box>
  );
}

function ProviderValue({ provider, providerName }: { provider: string; providerName: string }) {
  return (
    <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s6" }}>
      <Text typography="body3SemiBold" lx={{ color: "base", textAlign: "right" }}>
        {providerName}
      </Text>
      <ProviderIcon name={provider} />
    </Box>
  );
}
