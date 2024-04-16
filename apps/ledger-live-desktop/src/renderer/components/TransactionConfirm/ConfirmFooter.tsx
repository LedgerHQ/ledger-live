import React from "react";
import styled from "styled-components";
import { Trans, withTranslation } from "react-i18next";
import { getEnv } from "@ledgerhq/live-env";
import Text from "~/renderer/components/Text";
import { openURL } from "~/renderer/linking";

const HorizontalSeparator = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.palette.text.shade20};
  width: 100%;
`;

const termsOfUse = new Map<string, string>([
  ["paraswap", "https://paraswap.io/tos"],
  ["1inch", "https://1inch.io/assets/1inch_network_terms_of_use.pdf"],
]);

if (getEnv("PLAYWRIGHT_RUN")) {
  termsOfUse.set("dummy-live-app", "https://localhost.io/testtos");
}

type Props = {
  footer: React.ReactNode | undefined;
  manifestId?: string | null;
  manifestName?: string | null;
};

const ConfirmFooter = ({ footer, manifestId, manifestName }: Props) => {
  if (!manifestId) return;
  const termsOfUseUrl = termsOfUse.get(manifestId);
  if (!termsOfUseUrl) return;
  return (
    <>
      <HorizontalSeparator />
      {footer ? (
        footer
      ) : (
        <Text marginTop={30} data-test-id="confirm-footer-toc">
          <Trans
            i18nKey="TransactionConfirm.termsAndConditions"
            values={{ appName: manifestName || manifestId }}
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
        </Text>
      )}
    </>
  );
};

export default withTranslation()(ConfirmFooter);
