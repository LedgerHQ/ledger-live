import type { StepProps } from "./types";

type Gated = Pick<StepProps, "status" | "neurons" | "selectedNeuronId">;

/** The bridge's objection to the transaction as it stands, if it has one. */
export const bridgeObjection = ({ status }: Pick<StepProps, "status">): Error | undefined =>
  Object.values(status.errors)[0];

/**
 * Every gated step signs against one neuron and the transaction still names it after it has gone, so
 * a disburse or a refresh landing mid-flow turns the step into a dead end.
 */
export const neuronHasGone = ({
  neurons,
  selectedNeuronId,
}: Pick<StepProps, "neurons" | "selectedNeuronId">): boolean =>
  !neurons.some(neuron => neuron.id?.toString() === selectedNeuronId);

/**
 * What withholds a signature, in one place: the input steps' footer and the device step read the
 * same rule, so a transaction the footer refuses cannot reach the device by the other route.
 *
 * `bridgePending` is deliberately not part of it. The footer disables Continue while the bridge
 * recomputes; the device step waits instead, because a pending status still describes the previous
 * transaction and reporting it would flash a verdict that is about to be replaced.
 */
export const cannotSign = (props: Gated): boolean =>
  neuronHasGone(props) || bridgeObjection(props) !== undefined;
