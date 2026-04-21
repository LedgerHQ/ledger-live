import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
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
      const syncFromStorage = async () => {
        try {
          const storedState = await getStoreValue<LedgerRecoverSubscriptionStateEnum>(
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
        } catch {
          console.warn("useRecoverStateSync: failed to read SUBSCRIPTION_STATE from storage");
        }
      };
      syncFromStorage();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default useRecoverStateSync;
