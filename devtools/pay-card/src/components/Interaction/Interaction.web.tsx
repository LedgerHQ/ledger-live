import type { PayCardInteractionProps } from "../../types";

export interface InteractionProps extends PayCardInteractionProps {
  readonly onBack: () => void;
}

/** Native-only for now: the Card interaction probes ship with the mobile tool first. */
export function Interaction(_props: InteractionProps) {
  return null;
}
