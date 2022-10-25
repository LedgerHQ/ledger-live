import React from "react";
import { Trans } from "react-i18next";
import Button from "./Button";

export default function RetryButton(props: any) {
  return (
    <Button
      type="primary"
      title={<Trans i18nKey="common.retry" />}
      {...props}
    />
  );
}
