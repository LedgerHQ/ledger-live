import type { StepProps } from "./types";

type Gated = Pick<StepProps, "status" | "neurons" | "selectedNeuronId">;

/** The bridge's objection to the transaction as it stands, if it has one. */
export const bridgeObjection = ({ status }: Pick<StepProps, "status">): Error | undefined =>
  Object.values(status.errors)[0];

/**
 * The objection worth putting on screen, which is none while the bridge is recomputing: `status`
 * still describes the previous transaction, and every recompute after the first is debounced by
 * `DEBOUNCE_STATUS_DELAY` (`useBridgeTransaction`), so the verdict shown then is a stale one held
 * long enough to read — a red banner about an amount the user has already corrected.
 */
export const reportableObjection = (
  props: Pick<StepProps, "status" | "bridgePending">,
): Error | undefined => (props.bridgePending ? undefined : bridgeObjection(props));

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
 * `bridgePending` is deliberately not part of it: a recompute in flight is no answer to whether the
 * transaction may be signed, and the footer disables Continue on it separately. Waiting is what
 * reporting does — see reportableObjection.
 */
export const cannotSign = (props: Gated): boolean =>
  neuronHasGone(props) || bridgeObjection(props) !== undefined;
