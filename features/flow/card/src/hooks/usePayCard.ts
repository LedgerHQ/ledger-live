import { selectPayCard } from "@domain/entity-pay-card";
import { useSelector } from "react-redux";

export function usePayCard() {
  return useSelector(selectPayCard);
}
