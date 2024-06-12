import { TonOperation } from "@ledgerhq/live-common/families/ton/types";
import React from "react";
import { useTranslation } from "react-i18next";
import Section from "~/screens/OperationDetails/Section";

type Props = {
  operation: TonOperation;
};

function OperationDetailsExtra({ operation }: Props) {
  const { t } = useTranslation();
  return (
    <>
      {operation.extra.comment &&
        !operation.extra.comment.isEncrypted &&
        operation.extra.comment.text && (
          <Section
            title={t("families.ton.comment")}
            value={operation.extra.comment.text}
          />
        )}
    </>
  );
}

export default {
  OperationDetailsExtra,
};
