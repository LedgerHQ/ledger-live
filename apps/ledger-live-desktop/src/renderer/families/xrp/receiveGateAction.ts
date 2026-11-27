import { AccountIdSchema } from "@domain/entity-account";
import type { XrpFamily } from "./types";
import { openXrpDialog } from "./xrpDialog";

const receiveGateAction: NonNullable<XrpFamily["receiveGateAction"]> = ({
  account,
  token,
  dispatch,
}) => {
  dispatch(
    openXrpDialog(AccountIdSchema.parse(account.id), {
      screen: "addAsset",
      ...(token && { token }),
    }),
  );
};

export default receiveGateAction;
