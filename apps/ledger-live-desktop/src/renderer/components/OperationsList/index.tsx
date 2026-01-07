import React from "react";
import { compose } from "redux";
import { withTranslation } from "react-i18next";
import OperationsListV1, { Props } from "./OperationsListV1";

export function OperationsList(props: Props) {
  const { account, accounts } = props;
  if (!account && !accounts) {
    return null;
  }

  return <OperationsListV1 {...props} />;
}

export default compose<React.ComponentType<Props>>(withTranslation())(OperationsList);
