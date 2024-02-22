import React from "react";
import styled from "styled-components";
import { Trans, withTranslation } from "react-i18next";
import { TransactionCommon } from "@ledgerhq/types-live";
import Text from "~/renderer/components/Text";
import { openURL } from "~/renderer/linking";
import { getEnv } from "@ledgerhq/live-env";

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
  Footer:
    | React.ComponentType<{
        transaction: TransactionCommon;
      }>
    | undefined;
  transaction: Transaction;
  manifestId?: string | null;
  manifestName?: string | null;
};

const ConfirmApprovalFooter = ({ Footer, transaction, manifestId, manifestName }: Props) => {
  if (Footer) {
    return (
      <>
        <HorizontalSeparator />
        <Footer transaction={transaction} />
      </>
    );
  }
  if (manifestId) {
    const termsOfUseUrl = termsOfUse.get(manifestId);
    if (termsOfUseUrl !== undefined) {
      return (
        <>
          <HorizontalSeparator />
          <Text marginTop={30} data-test-id="confirm-approval-footer-toc">
            <Trans
              i18nKey="approve.termsAndConditions"
              values={{ appName: manifestName }}
              components={[
                <Text
                  key={manifestId}
                  onClick={() => openURL(termsOfUseUrl)}
                  style={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {`${manifestId}'s terms of use.`}
                </Text>,
              ]}
            />
          </Text>
        </>
      );
    }
  }
};

export default withTranslation()(ConfirmApprovalFooter);
