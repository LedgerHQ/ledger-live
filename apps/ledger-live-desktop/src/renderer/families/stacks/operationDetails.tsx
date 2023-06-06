import React from "react";
import { Trans } from "react-i18next";
import { Account } from "@ledgerhq/types-live";
import {
  OpDetailsTitle,
  OpDetailsData,
  OpDetailsSection,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import Ellipsis from "~/renderer/components/Ellipsis";
import { OperationDetailsExtraProps } from "~/renderer/families/types";

const OperationDetailsExtra = ({ extra }: OperationDetailsExtraProps<Account>) => {
  return (
    <>
      {Object.keys(extra).map(key => {
        if (["memo"].includes(key)) {
          return (
            <OpDetailsSection key={key}>
              <OpDetailsTitle>
                <Trans i18nKey={`families.stacks.${key}`} defaults={key} />
              </OpDetailsTitle>
              <OpDetailsData>
                <Ellipsis>{extra[key]}</Ellipsis>
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
