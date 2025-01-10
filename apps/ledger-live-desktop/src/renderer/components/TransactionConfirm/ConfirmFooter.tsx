import React from "react";
import styled from "styled-components";
import { Trans, withTranslation } from "react-i18next";
import { getEnv } from "@ledgerhq/live-env";
import Text from "~/renderer/components/Text";
import { openURL } from "~/renderer/linking";
import { uniwapUniversalRouterAddr } from "@ledgerhq/live-common/exchange/providers/swap";
const HorizontalSeparator = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.palette.text.shade20};
  width: 100%;
`;

const termsOfUse = new Map<string, string>([
  ["paraswap", "https://paraswap.io/tos"],
  ["1inch", "https://1inch.io/assets/1inch_network_terms_of_use.pdf"],
  ["Uniswap", "https://uniswap.org/terms-of-service"],
]);

const privacyPolicy = new Map<string, string>([["Uniswap", "https://uniswap.org/privacy-policy"]]);

if (getEnv("PLAYWRIGHT_RUN")) {
  termsOfUse.set("dummy-live-app", "https://localhost.io/testtos");
}

type Props = {
  footer: React.ReactNode | undefined;
  manifestId?: string | null;
  transaction?: Transaction | null;
  manifestName?: string | null;
};

const ConfirmFooter = ({ footer, transaction, manifestId, manifestName }: Props) => {
  if (!manifestId) return;
  const appNameByAddr = transaction?.recipient === uniwapUniversalRouterAddr ? "Uniswap" : null;
  const termsOfUseUrl = termsOfUse.get(appNameByAddr || manifestId);
  const privacyUrl = privacyPolicy.get(appNameByAddr || manifestId);
  if (!termsOfUseUrl) return;
  return (
    <>
      <HorizontalSeparator />
      {footer ? (
        footer
      ) : (
        <Text marginTop={30} data-testid="confirm-footer-toc">
          {privacyUrl ? (
            <Trans
              i18nKey="TransactionConfirm.termsAndConditionsWithPrivacy"
              values={{ appName: appNameByAddr || manifestName || manifestId }}
              components={[
                <Text
                  key={manifestId}
                  onClick={() => openURL(termsOfUseUrl)}
                  style={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                />,
                <Text
                  key={manifestId + "1"}
                  onClick={() => openURL(privacyUrl)}
                  style={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                />,
              ]}
            />
          ) : (
            <Trans
              i18nKey="TransactionConfirm.termsAndConditions"
              values={{ appName: appNameByAddr || manifestName || manifestId }}
              components={[
                <Text
                  key={manifestId}
                  onClick={() => openURL(termsOfUseUrl)}
                  style={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                />,
              ]}
            />
          )}
        </Text>
      )}
    </>
  );
};

export default withTranslation()(ConfirmFooter);
