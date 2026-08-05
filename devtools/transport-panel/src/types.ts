import type { MessageMap, Transport, Role } from "@devtools/transport";

export interface TransportPanelProps<M extends MessageMap = MessageMap> {
  readonly transport: Transport<M>;
  readonly hubUrl: string;
  readonly setHubUrl: (url: string) => void;
  readonly role: Role;
  readonly target?: string;
  readonly setTarget?: (url: string) => void;
}
