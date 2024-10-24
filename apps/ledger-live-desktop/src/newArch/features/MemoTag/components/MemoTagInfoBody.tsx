import React from "react";
import { Text } from "@ledgerhq/react-ui";
import { Trans } from "react-i18next";
import LearnMoreCta from "./LearnMoreCta";
import { urls } from "~/config/urls";

const MemoTagInfoBody = () => (
  <div data-testid="memo-tag-info-body">
    <Text variant="paragraphLineHeight" color="neutral.c80" fontSize={13}>
      <Trans i18nKey="receive.memoTag.description">
        <Text variant="paragraphLineHeight" fontWeight="700" color="neutral.c90"></Text>
      </Trans>
    </Text>
    <br />
    <LearnMoreCta style={{ textDecoration: "underline" }} url={urls.memoTag.learnMore} />
  </div>
);

export default MemoTagInfoBody;
