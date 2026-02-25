import React from "react";
import { Trans } from "~/context/Locale";
import LText from "./LText";

const el = () => (
  <LText
    allowFontScaling={false}
    style={{
      padding: 60,
      opacity: 0.5,
      textAlign: "center",
    }}
  >
    <Trans i18nKey="common:operationList.noMoreTransactions" />
  </LText>
);

export default el;
