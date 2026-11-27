import { AccountIdSchema } from "@domain/entity-account";
import type { XrpFamily } from "./types";
import { openXrpDialog } from "./xrpDialog";

const addAssetAction: NonNullable<XrpFamily["addAssetAction"]> = ({ account, dispatch }) => {
  dispatch(openXrpDialog(AccountIdSchema.parse(account.id), { screen: "addAsset" }));
};

export default addAssetAction;
