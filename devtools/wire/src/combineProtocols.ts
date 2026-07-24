import type { TransportProtocol } from "@devtools/transport";

type Head<Ps extends TransportProtocol<any>[]> = Ps extends [
  infer H extends TransportProtocol<any>,
  ...TransportProtocol<any>[],
]
  ? H
  : never;

type Tail<Ps extends TransportProtocol<any>[]> = Ps extends [
  TransportProtocol<any>,
  ...infer R extends TransportProtocol<any>[],
]
  ? R
  : [];

type MessageMapOf<P extends TransportProtocol<any>> =
  P extends TransportProtocol<infer M> ? M : never;

type MergeMessageMaps<Ps extends TransportProtocol<any>[]> = Ps extends []
  ? {}
  : MessageMapOf<Head<Ps>> & MergeMessageMaps<Tail<Ps>>;

export function combineProtocols<Ps extends TransportProtocol<any>[]>(
  ...protocols: Ps
): TransportProtocol<MergeMessageMaps<Ps>> {
  const ps = protocols;
  const combined: TransportProtocol<MergeMessageMaps<Ps>> = {
    onOpen(transport) {
      for (const p of ps) p.onOpen?.(transport);
    },
    onReceive(kind, payload, env) {
      for (const p of ps) p.onReceive(kind, payload, env);
    },
    onClose() {
      for (const p of ps) p.onClose?.();
    },
    onError(err) {
      for (const p of ps) p.onError?.(err);
    },
  };
  return combined;
}
