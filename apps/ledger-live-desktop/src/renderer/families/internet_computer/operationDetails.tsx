import React from "react";
import { Trans } from "react-i18next";
import {
  OpDetailsTitle,
  OpDetailsData,
  OpDetailsSection,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import Ellipsis from "~/renderer/components/Ellipsis";
import type { Account } from "@ledgerhq/types-live";

type OperationDetailsExtraProps = {
  extra: { [key: string]: string };
  type: string;
  account: Account;
};

const OperationDetailsExtra = ({ extra }: OperationDetailsExtraProps) => {
  return (
    <>
      {Object.keys(extra).map(key => {
        if (["memo"].includes(key)) {
          return (
            <OpDetailsSection key={key}>
              <OpDetailsTitle>
                <Trans i18nKey={`operationDetails.extra.${key}`} defaults={key} />
              </OpDetailsTitle>
              <OpDetailsData>
                <Ellipsis>{extra[key] ?? "-"}</Ellipsis>
              </OpDetailsData>
            </OpDetailsSection>
          );
        }

        return null;
      })}
    </>
  );
};

export default {
  OperationDetailsExtra,
};
