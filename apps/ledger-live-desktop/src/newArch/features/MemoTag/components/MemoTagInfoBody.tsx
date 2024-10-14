import React from "react";
import { Link, Text } from "@ledgerhq/react-ui";
import { Trans } from "react-i18next";
import { openURL } from "~/renderer/linking";
import { MEMO_TAG_LEARN_MORE_LINK } from "../constants";

const MemoTagInfoBody = () => {
  const handleOpenLMLink = () => openURL(MEMO_TAG_LEARN_MORE_LINK);

  return (
    <div data-testid="memo-tag-info-body">
      <Text variant="paragraphLineHeight" color="neutral.c80" fontSize={13}>
        <Trans i18nKey="receive.memoTag.description">
          <Text variant="paragraphLineHeight" fontWeight="700" color="neutral.c90"></Text>
        </Trans>
      </Text>
      <br />
      <Link
        size="small"
        color={"neutral.c80"}
        onClick={handleOpenLMLink}
        textProps={{
          fontSize: "13px",
        }}
        style={{ textDecoration: "underline" }}
      >
        <Trans i18nKey="receive.memoTag.learnMore" />
      </Link>
    </div>
  );
};

export default MemoTagInfoBody;
