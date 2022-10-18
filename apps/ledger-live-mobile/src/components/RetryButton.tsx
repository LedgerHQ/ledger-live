import React from "react";
import { Trans } from "react-i18next";
import Button, { BaseButtonProps } from "./Button";

export default function RetryButton(props: BaseButtonProps) {
  return (
    <Button
      type="primary"
      title={<Trans i18nKey="common.retry" />}
      {...props}
    />
  );
}
