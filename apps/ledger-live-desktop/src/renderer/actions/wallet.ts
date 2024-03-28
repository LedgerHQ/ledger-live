import { setAccountStarred } from "@ledgerhq/live-wallet/store";

export const toggleStarAction = (id: string, value: boolean) => {
  const action = setAccountStarred(id, value);
  action.type = "DB:" + action.type;
  return action;
};
