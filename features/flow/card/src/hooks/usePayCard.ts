import { useCallback } from "react";
import { openPayCard } from "@domain/entity-pay-card";
import { useDispatch } from "react-redux";

export function usePayCard() {
  const dispatch = useDispatch();
  const openHostedLogin = useCallback(
    (loginUrl: string) => {
      dispatch(openPayCard(loginUrl));
    },
    [dispatch],
  );

  return { openHostedLogin };
}
