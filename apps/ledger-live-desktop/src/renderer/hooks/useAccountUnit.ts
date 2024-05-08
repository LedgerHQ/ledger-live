import { useSelector } from "react-redux";
import { accountUnitSelector } from "../reducers/settings";
import { AccountLike } from "@ledgerhq/types-live";
import { State } from "../reducers";

export function useAccountUnit(account: AccountLike) {
  const unit = useSelector((state: State) => accountUnitSelector(state, account));
  return unit;
}

export function useMaybeAccountUnit(account?: AccountLike | null) {
  const unit = useSelector((state: State) =>
    account ? accountUnitSelector(state, account) : undefined,
  );
  return unit;
}
