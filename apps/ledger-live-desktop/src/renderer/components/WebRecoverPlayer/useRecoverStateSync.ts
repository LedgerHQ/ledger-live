import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { selectRecoverStateByProtectId, setRecoverState } from "~/renderer/reducers/recoverState";
import { getStoreValue } from "~/renderer/store";

function useRecoverStateSync(protectId: string): void {
  const dispatch = useDispatch();
  const currentState = useSelector(selectRecoverStateByProtectId(protectId));
  const currentStateRef = useRef(currentState);

  useEffect(() => {
    currentStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    return () => {
      const state = currentStateRef.current;
      const storedState = getStoreValue<LedgerRecoverSubscriptionStateEnum>(
        "SUBSCRIPTION_STATE",
        protectId,
      );
      if (storedState !== undefined && storedState !== state.subscriptionState) {
        dispatch(
          setRecoverState({
            protectId,
            subscriptionState: storedState,
          }),
        );
      }
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default useRecoverStateSync;
