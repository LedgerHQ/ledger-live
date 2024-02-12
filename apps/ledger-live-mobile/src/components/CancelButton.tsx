import React from "react";
import { Trans } from "react-i18next";
import Button from "./Button";

type Props = Omit<React.ComponentProps<typeof Button>, "type" | "title">;

const CancelButton = (props: Props) => {
  return <Button type="secondary" title={<Trans i18nKey="common.cancel" />} {...props} />;
};

export default CancelButton;
