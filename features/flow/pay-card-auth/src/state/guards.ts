import type { CardLoginContext } from "./types";

/**
 * The machine's named guards.
 *
 * Only a guard that reads `context` alone can live here. `setup()` types a named guard with the whole
 * machine event union, so a named guard cannot reach an actor answer. Every guard that reads
 * `event.output` stays inline at its transition, where XState narrows the event to that answer.
 */

type ContextArgs = Readonly<{ context: CardLoginContext }>;

export const hasErrorKind = ({ context }: ContextArgs) => context.errorKind !== null;

export const shouldResumeAuthenticated = ({ context }: ContextArgs) => context.resumeAuthenticated;
