import React from "react";
import styled from "styled-components";
import { Trans, withTranslation } from "react-i18next";
import { getEnv } from "@ledgerhq/live-env";
import Text from "~/renderer/components/Text";
import { openURL } from "~/renderer/linking";
import {
  dexProvidersContractAddress,
  privacyPolicy,
  termsOfUse,
} from "@ledgerhq/live-common/exchange/providers/swap";

const HorizontalSeparator = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.neutral.c40};
  width: 100%;
`;

if (getEnv("PLAYWRIGHT_RUN")) {
  termsOfUse["dummy-live-app"] = "https://localhost.io/testtos";
}

type Props = {
  footer: React.ReactNode | undefined;
  manifestId?: string | null;
  transaction?: Transaction | null;
  manifestName?: string | null;
};

const handleUrlClick = (url?: string) => () => url && openURL(url);

const ConfirmFooter = ({ footer, transaction, manifestId, manifestName }: Props) => {
  if (!manifestId) return;
  const appNameByAddr = dexProvidersContractAddress[transaction?.recipient?.toLowerCase() || ""];
  const termsOfUseUrl = termsOfUse[appNameByAddr || manifestId];
  const privacyUrl = privacyPolicy[appNameByAddr || manifestId];
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
              values={{ appName: appNameByAddr || manifestName || manifestId }}
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
      )}
    </>
  );
};

export default withTranslation()(ConfirmFooter);
