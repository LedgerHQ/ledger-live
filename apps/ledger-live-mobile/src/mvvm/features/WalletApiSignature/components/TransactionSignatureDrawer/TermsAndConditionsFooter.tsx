import React from "react";
import { Link, Text } from "@ledgerhq/lumen-ui-rnative";
import {
  dexProvidersContractAddress,
  privacyPolicy,
  termsOfUse,
} from "@ledgerhq/live-common/exchange/providers/swap";
import { Trans } from "~/context/Locale";

export type TermsAndConditionsFooterProps = Readonly<{
  /** Calling live-app manifest id, used to resolve the provider terms. */
  manifestId: string;
  /** Calling live-app manifest name, used as a display fallback. */
  manifestName?: string;
  /** Transaction recipient, used to resolve the DEX provider from its router address. */
  recipient?: string;
}>;

/**
 * Non-blocking terms of use notice shown while the user confirms a wallet-api swap on
 * their device, mirroring the desktop `TransactionConfirm/ConfirmFooter`. The provider is
 * resolved from the transaction recipient (DEX router address) first, then the manifest id.
 */
export function TermsAndConditionsFooter({
  manifestId,
  manifestName,
  recipient,
}: TermsAndConditionsFooterProps) {
  const appNameByAddr = dexProvidersContractAddress[recipient?.toLowerCase() ?? ""];
  const providerKey = appNameByAddr || manifestId;
  const termsOfUseUrl = termsOfUse[providerKey];
  const privacyUrl = privacyPolicy[providerKey];

  if (!manifestId || !termsOfUseUrl) {
    return null;
  }

  const appName = appNameByAddr || manifestName || manifestId;

  const linkComponents = [
    <Link key="terms" size="sm" href={termsOfUseUrl} />,
    ...(privacyUrl ? [<Link key="privacy" size="sm" href={privacyUrl} />] : []),
  ];

  return (
    <Text
      typography="body2"
      lx={{ color: "muted", textAlign: "center", paddingHorizontal: "s16" }}
      testID="wallet-api-signature-terms"
    >
      <Trans
        i18nKey={
          privacyUrl
            ? "walletApiSignTransaction.sign.termsAndConditionsWithPrivacy"
            : "walletApiSignTransaction.sign.termsAndConditions"
        }
        values={{ appName }}
        components={linkComponents}
      />
    </Text>
  );
}
