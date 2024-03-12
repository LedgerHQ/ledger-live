import React from "react";
import { Trans } from "react-i18next";
import { GenericInformationBody } from "~/components/GenericInformationBody";
import { InformationFill } from "@ledgerhq/native-ui/assets/icons";

export const EvmNetworkFeeInfo = () => {
  return (
    <GenericInformationBody
      Icon={InformationFill}
      iconColor={"primary.c80"}
      title={<Trans i18nKey="send.fees.titleMaxFees" />}
      description={<Trans i18nKey="send.fees.networkInfoMaxFees" />}
    />
  );
};
