import React from "react";
import AddTokenDialog from "./AddTokenDialog";
import ManageAssetsDialog from "./ManageAssetsDialog";
import type { XrpFamily } from "./types";

const AccountDialogs: NonNullable<XrpFamily["AccountDialog"]> = props => (
  <>
    <ManageAssetsDialog {...props} />
    <AddTokenDialog {...props} />
  </>
);

export default AccountDialogs;
