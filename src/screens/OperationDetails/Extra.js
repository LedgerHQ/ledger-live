// @flow
import React from "react";
import { translate } from "react-i18next";
import type { TFunction } from "react-i18next";
import Section from "./Section";

type Props = {
  extra: { [key: string]: string },
  t: TFunction,
};

function OperationDetailsExtra({ extra, t }: Props) {
  return Object.entries(extra).map(([key, value]) => (
    <Section
      title={t(`operationDetails.extra.${key}`)}
      // $FlowFixMe
      value={value.toString()}
    />
  ));
}

export default translate()(OperationDetailsExtra);
