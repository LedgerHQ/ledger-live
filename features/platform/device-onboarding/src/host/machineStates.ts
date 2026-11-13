import { getStateNodes, type SnapshotFrom } from "xstate";
import { deviceOnboardingMachine } from "../machine";

export function stateValueToString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || typeof value !== "object") {
    return String(value);
  }

  return Object.entries(value)
    .map(([key, child]) => {
      const suffix = stateValueToString(child);
      return suffix ? `${key}.${suffix}` : key;
    })
    .join(",");
}

/** A state this step can reach. `auto` means the machine may move there with no event. */
export type HostNextState = {
  readonly event: string;
  readonly state: string;
};

type MachineNode = typeof deviceOnboardingMachine.root;

// The host sends these from any state, so listing them on every step adds nothing.
const hiddenFromNextStates = new Set(["LOCKED", "TRANSPORT_LOST", "QUIT", "SESSION_CHANGED"]);

/** The deepest active node is the current state. */
function currentNode(snapshot: SnapshotFrom<typeof deviceOnboardingMachine>): MachineNode {
  return getStateNodes(deviceOnboardingMachine.root, snapshot.value).reduce((deepest, node) =>
    node.path.length > deepest.path.length ? node : deepest,
  ) as MachineNode;
}

/**
 * The events a node handles, with every target. An event with no target is still accepted: the
 * machine stays in `current`.
 */
function transitionsOf(node: MachineNode, current: MachineNode): [string, MachineNode][] {
  const always = (node.always ?? []).flatMap(transition =>
    (transition.target ?? []).map(target => ["auto", target] as [string, MachineNode]),
  );
  const onEvents = [...node.transitions]
    .filter(([event]) => !event.startsWith("xstate.") && !hiddenFromNextStates.has(event))
    .flatMap(([event, transitions]) =>
      transitions.flatMap(transition =>
        (transition.target ?? [current]).map(target => [event, target] as [string, MachineNode]),
      ),
    );
  return [...always, ...onEvents];
}

/** An event without a guard stops the walk: the parents never see it. */
function handlesAlways(node: MachineNode, event: string): boolean {
  return node.transitions.get(event)?.some(transition => transition.guard === undefined) ?? false;
}

export function nextStatesFrom(
  snapshot: SnapshotFrom<typeof deviceOnboardingMachine> | null,
): HostNextState[] {
  if (snapshot?.status !== "active") return [];

  const current = currentNode(snapshot);
  const rows = new Map<string, HostNextState>();
  const handled = new Set<string>();

  // Walk from the current state up to the root, like xstate picks a transition.
  for (let node: MachineNode | undefined = current; node; node = node.parent) {
    for (const [event, target] of transitionsOf(node, current)) {
      const state = target.path.join(".");
      if (handled.has(event) || !state) continue;
      rows.set(`${event}\0${state}`, { event, state });
    }
    for (const event of node.transitions.keys()) {
      if (handlesAlways(node, event)) handled.add(event);
    }
  }

  return [...rows.values()];
}
