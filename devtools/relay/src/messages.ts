export const msg = {
  listening: (port: number) => `[relay] listening on ws://localhost:${port}`,
  wifiUrl: (url: string) => `[relay] Wi-Fi: ${url}`,
  noWifiIp: `[relay] no Wi-Fi IP detected — is the network connected?`,
  tokenRejected: (from: string | undefined) =>
    `[relay] connection rejected — invalid or missing token (from ${from})`,
  invalidIdentity: (url: string | undefined) =>
    `[relay] connection without valid identity (url=${url}) — closing`,
  sessionless: (id: string) =>
    `[relay] tool "${id}" connected without a target — idle, cannot pair`,
  evicted: (role: string, id: string) => `[relay] evicted previous ${role} of "${id}"`,
  attached: (role: string, id: string, hostId: string) => `[relay] ${role} "${id}" → "${hostId}"`,
  paired: (id: string) => `[relay] paired tool ⇄ host "${id}"`,
  forwarded: (id: string, peer: string, kind: string) => `[relay] "${id}" → ${peer} (${kind})`,
  dropped: (id: string, kind: string, peer: string) =>
    `[relay] "${id}" dropped ${kind} — no ${peer} connected`,
  disconnectedPeer: (role: string, id: string, hostId: string) =>
    `[relay] ${role} "${id}" disconnected from "${hostId}"`,
  disconnected: (id: string) => `[relay] tool "${id}" disconnected`,
  socketError: (err: string) => `[relay] socket error: ${err}`,
  serverError: (err: string) => `[relay] server error: ${err}`,
};
