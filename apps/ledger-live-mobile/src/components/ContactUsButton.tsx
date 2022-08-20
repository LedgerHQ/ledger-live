import React from "react";
import { Trans } from "react-i18next";
import Button from "./Button";

export default function ContactUsButton(props: any) {
  return (
    <Button
      type="secondary"
      title={<Trans i18nKey="common.contactUs" />}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onPress={() => {}} // TODO do something
      {...props}
    />
  );
}
