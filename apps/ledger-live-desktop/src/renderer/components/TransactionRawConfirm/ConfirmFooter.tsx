import React from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { getEnv } from "@ledgerhq/live-env";
import Text from "~/renderer/components/Text";
import { openURL } from "~/renderer/linking";
import { privacyPolicy, termsOfUse } from "@ledgerhq/live-common/exchange/providers/swap";

const HorizontalSeparator = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.palette.text.shade20};
  width: 100%;
`;

if (getEnv("PLAYWRIGHT_RUN")) {
  termsOfUse["dummy-live-app"] = "https://localhost.io/testtos";
}

type Props = {
  transaction: string;
  manifestId?: string | null;
  manifestName?: string | null;
};

const handleUrlClick = (url?: string) => () => url && openURL(url);

const ConfirmFooter = ({ manifestId, manifestName }: Props) => {
  if (!manifestId) return;
  const termsOfUseUrl = termsOfUse[manifestId];
  const privacyUrl = privacyPolicy[manifestId];
  if (!termsOfUseUrl) return;
  return (
    <>
      <HorizontalSeparator />
      <Text marginTop={30} data-testid="confirm-footer-toc">
        {privacyUrl ? (
          <Trans
            i18nKey="TransactionConfirm.termsAndConditionsWithPrivacy"
            values={{ appName: manifestName || manifestId }}
            components={[
              <Text
                key={manifestId}
                onClick={handleUrlClick(termsOfUseUrl)}
                style={{
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              />,
              <Text
                key={manifestId + "1"}
                onClick={handleUrlClick(privacyUrl)}
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
            values={{ appName: manifestName || manifestId }}
            components={[
              <Text
                key={manifestId}
                onClick={handleUrlClick(termsOfUseUrl)}
                style={{
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              />,
            ]}
          />
        )}
      </Text>
    </>
  );
};

export default ConfirmFooter;
