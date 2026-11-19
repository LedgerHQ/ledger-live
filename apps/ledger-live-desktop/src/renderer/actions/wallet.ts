import { setAccountStarred } from "~/renderer/reducers/wallet";

export const toggleStarAction = (id: string, value: boolean) => {
  return setAccountStarred(id, value);
};
