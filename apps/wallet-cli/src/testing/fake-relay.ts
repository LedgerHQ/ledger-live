import {
  createAgentEnrollmentChannelCandidate,
  createAgentEnrollmentChannelHost,
  serializeAgentEnrollmentCompletion,
  serializeAgentRecoveryCompletion,
  type AgentEnrollmentChannelHost,
  type AgentEnrollmentChannelRequest,
  type AgentEnrollmentCompletionV2,
  type AgentRecoveryRequest,
  type EnrollmentChannelWebSocket,
} from "@ledgerhq/agent-intent-sdk";

type HostOptions = Parameters<typeof createAgentEnrollmentChannelHost>[0];
type Side = "host" | "user";
type EventType = "open" | "message" | "error" | "close";
type Listener = (event: { data: unknown }) => void;

const KEEPALIVE_PING = "ping";

/** One end of a relay session, connected in memory to the other side. */
class RelaySocket implements EnrollmentChannelWebSocket {
  readonly #listeners = new Map<EventType, Listener[]>();
  closed = false;

  constructor(
    readonly side: Side,
    readonly route: (from: RelaySocket, data: string) => void,
    readonly onClose: (socket: RelaySocket) => void = () => undefined,
  ) {
    setTimeout(() => this.emit("open"));
  }

  addEventListener(type: EventType, listener: Listener): void {
    this.#listeners.set(type, [...(this.#listeners.get(type) ?? []), listener]);
  }

  send(data: string): void {
    if (this.closed) throw new Error("The relay socket is closed.");
    this.route(this, data);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    setTimeout(() => this.emit("close"));
    this.onClose(this);
  }

  emit(type: EventType, data?: unknown): void {
    for (const listener of this.#listeners.get(type) ?? []) listener({ data });
  }
}

/** What the human's web app does once the CLI waits on the relay. */
export type RelayUserScript = (relay: FakeRelay) => Promise<void>;

/**
 * The Trustchain relay and the human's side of it, for `_setTestRelayChannelHost`. The CLI's relay
 * host is the SDK's, on in-memory sockets; once the CLI waits for approval, the test's script plays
 * the web app (`approve`), or the relay drops the connections (`dropConnection`).
 */
export class FakeRelay {
  /** The options the CLI built its relay host with. */
  hostOptions: Omit<HostOptions, "webSocketFactory"> | undefined;
  /** The signed request the CLI waits on, as the web app reads it from the link. */
  request: AgentEnrollmentChannelRequest | undefined;
  /** Each relayed message as `<side>:<message>`, e.g. `user:TrustchainShareCredential`. */
  readonly messages: string[] = [];
  /** The CLI's message the relay drops every connection on, failing its send. */
  dropOnHostMessage: string | undefined;
  #host: RelaySocket | undefined;
  readonly #users: RelaySocket[] = [];
  #script: RelayUserScript | undefined;
  #scriptRun: Promise<void> = Promise.resolve();

  /** Runs `script` once the CLI waits for approval; `settled()` reports how it ended. */
  onceWaiting(script: RelayUserScript): this {
    this.#script = script;
    return this;
  }

  /** Rejects when the script failed, e.g. an approval the CLI refused unexpectedly. */
  settled(): Promise<void> {
    return this.#scriptRun;
  }

  readonly createHost = (options: HostOptions): AgentEnrollmentChannelHost => {
    const { webSocketFactory: _, ...rest } = options;
    this.hostOptions = rest;
    const host = createAgentEnrollmentChannelHost({
      ...rest,
      webSocketFactory: () => {
        this.#host = new RelaySocket("host", this.#route, () => this.#hostLeft());
        return this.#host;
      },
    });
    return {
      binding: host.binding,
      close: () => host.close(),
      waitForCompletion: input => {
        this.request = input.request;
        const completion = host.waitForCompletion(input);
        const script = this.#script;
        this.#script = undefined;
        // The human acts later, once the CLI printed the link.
        if (script) this.#scriptRun = Bun.sleep(0).then(() => script(this));
        return completion;
      },
    };
  };

  /** The web app's approval: delivers `completion` and resolves once the CLI acknowledged it. */
  approve(completion: string): Promise<void> {
    const request = this.#requireRequest();
    const candidate = createAgentEnrollmentChannelCandidate({
      request,
      relayBaseUrl: this.hostOptions!.relayBaseUrl,
      webSocketFactory: () => {
        const socket = new RelaySocket("user", this.#route);
        this.#users.push(socket);
        return socket;
      },
    });
    return candidate.deliver(completion).finally(() => candidate.close());
  }

  /** The relay closes every connection, the CLI's and the web app's. */
  dropConnection(): void {
    this.#host?.close();
    for (const user of this.#users) user.close();
  }

  /** A completion of this enrollment, for the agent key the request names. */
  enrollmentCompletion(
    accountAccess: Partial<AgentEnrollmentCompletionV2["accountAccess"]> = {},
    trustchainId = "app18-root",
  ): string {
    const request = this.#requireRequest();
    return serializeAgentEnrollmentCompletion({
      agentPubkey: request.publicKey,
      trustchainId,
      accountAccess: {
        mode: "direct-app16-key-reader",
        environment: request.channel.environment,
        trustchainId: "app16-root",
        applicationPath: "m/0'/16'/0'",
        ...accountAccess,
      },
    });
  }

  /** A completion of this recovery, back into the request's previous Trustchain. */
  recoveryCompletion(): string {
    const request = this.#requireRequest() as AgentRecoveryRequest;
    return serializeAgentRecoveryCompletion({
      agentPubkey: request.publicKey,
      previousTrustchainId: request.previousTrustchainId,
      requestSignature: request.signature,
      trustchainId: request.previousTrustchainId,
    });
  }

  #requireRequest(): AgentEnrollmentChannelRequest {
    if (!this.request) throw new Error("FakeRelay: the CLI is not waiting on the relay yet.");
    return this.request;
  }

  // A host that leaves before acknowledging ends the session for the web app too.
  #hostLeft(): void {
    if (this.messages.includes("host:TrustchainAddedMember")) return;
    for (const user of this.#users) user.close();
  }

  readonly #route = (from: RelaySocket, data: string): void => {
    // The relay answers a keepalive itself.
    if (data === KEEPALIVE_PING) {
      setTimeout(() => from.emit("message", "pong"));
      return;
    }
    const { message } = JSON.parse(data) as { message: string };
    this.messages.push(`${from.side}:${message}`);
    if (from.side === "host" && message === this.dropOnHostMessage) {
      this.dropConnection();
      throw new Error("The relay connection was lost.");
    }
    const peers = from.side === "host" ? this.#users : this.#host ? [this.#host] : [];
    for (const peer of peers) {
      if (!peer.closed) setTimeout(() => peer.emit("message", data));
    }
  };
}
