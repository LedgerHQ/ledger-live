import React from "react";
import ManageAssetsDialog from "./ManageAssetsDialog";
import type { XrpFamily } from "./types";
import { getManagedTokenAccounts } from "./utils";
import { isXrpDialogParams } from "./xrpDialog";

const AccountDialogs: NonNullable<XrpFamily["AccountDialog"]> = ({ account, params, onClose }) => {
  if (!isXrpDialogParams(params)) return null;
  if (account.type !== "Account") return null;

  return (
    <ManageAssetsDialog
      account={account}
      tokenAccounts={getManagedTokenAccounts(account)}
      onClose={onClose}
    />
  );
};

export default AccountDialogs;
