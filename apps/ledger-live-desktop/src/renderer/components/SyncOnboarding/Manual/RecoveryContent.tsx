import React, { useLayoutEffect, useRef } from "react";
import { Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

const RecoveryContent = () => {
  const { t } = useTranslation();

  const storylyRef = useRef();
  useLayoutEffect(() => {
    storylyRef.current.init({
      token:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTIxOTh9.XqNitheri5VPDqebtA4JFu1VucVOHYlryki2TqCb1DQ",
      layout: "classic",
      props: {
        storyGroupAlign: "left",
        storyGroupBorderRadius: "35",
        storyGroupTextColor: "#FFFFFF",
        storyGroupTextSeenColor: "#FFFFFF",
        storyGroupIconBorderColorSeen: ["#461AF7", "#FF6E33"],
      },
    });
  }, []);

  return (
    <>
      <Text>{t("syncOnboarding.manual.recoveryContent.content")}</Text>
      <storyly-web ref={storylyRef} />
    </>
  );
};

export default RecoveryContent;
