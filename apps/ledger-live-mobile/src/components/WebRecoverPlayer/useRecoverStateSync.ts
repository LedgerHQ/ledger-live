import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "~/context/hooks";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { selectRecoverStateByProtectId, setRecoverState } from "~/reducers/recoverState";
import { getStoreValue } from "~/store";

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
      getStoreValue<LedgerRecoverSubscriptionStateEnum>("SUBSCRIPTION_STATE", protectId).then(
        storedState => {
          if (storedState !== undefined && storedState !== state.subscriptionState) {
            dispatch(
              setRecoverState({
                protectId,
                subscriptionState: storedState,
                displayBanner: state.displayBanner,
              }),
            );
          }
        },
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default useRecoverStateSync;
