import { useGetCardStatusQuery } from "@domain/api-card-management";
import type { CardVisualProps, CardVisualViewProps } from "../../types";

export function useCardVisualViewModel(props: CardVisualProps): CardVisualViewProps {
  const { data: cardStatus } = useGetCardStatusQuery();

  return { ...props, isFrozen: cardStatus?.status === "FROZEN" };
}
