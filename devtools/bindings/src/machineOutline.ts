import { deviceOnboardingMachine, userEvents } from "@ledgerhq/device-onboarding";

type MachineNode = typeof deviceOnboardingMachine.root;
type MachineTransition = NonNullable<MachineNode["always"]>[number];

const userEventTypes = new Set<string>(userEvents.map(event => event.type));

// The app sends these about the session and its own flows. UNLOCKED also comes from unlock polling.
const appEventTypes = new Set([
  "SESSION_READY",
  "SESSION_CHANGED",
  "TRANSPORT_LOST",
  "LOCKED",
  "UNLOCKED",
  "FIRMWARE_UPDATE_FLOW_CLOSED",
]);

/** Who sends the event: the user, the app, the device (through the machine's actors), or nobody. */
function sourceOf(event: string): "user" | "app" | "device" | "auto" {
  if (event === "auto") return "auto";
  if (userEventTypes.has(event)) return "user";
  if (appEventTypes.has(event)) return "app";
  return "device";
}

/** No target means the state stays and only runs actions. */
function transitionRow(event: string, transition: MachineTransition) {
  const { guard } = transition;
  return {
    event,
    source: sourceOf(event),
    targets: (transition.target ?? []).map(target => target.path.join(".")),
    // The machine names every guard, so only a string guard has a name to show.
    ...(typeof guard === "string" ? { guard } : {}),
  };
}

function transitionsOf(node: MachineNode) {
  return [
    ...(node.always ?? []).map(transition => transitionRow("auto", transition)),
    ...[...node.transitions].flatMap(([event, transitions]) =>
      transitions.map(transition => transitionRow(event, transition)),
    ),
  ];
}

function nodesOf(node: MachineNode): MachineNode[] {
  return [node, ...Object.values(node.states).flatMap(child => nodesOf(child as MachineNode))];
}

/** The whole machine as data, parents before children, so any devtool can draw it as a tree. */
export function machineOutline() {
  return nodesOf(deviceOnboardingMachine.root).map(node => ({
    path: node.path.join("."),
    key: node.key,
    depth: node.path.length,
    kind: node.type,
    initial: node.parent?.initial.target.includes(node) ?? false,
    invokes: node.invoke.map(invoke => (typeof invoke.src === "string" ? invoke.src : invoke.id)),
    transitions: transitionsOf(node),
  }));
}
