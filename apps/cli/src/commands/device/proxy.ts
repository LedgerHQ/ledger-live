import { createProxyJob, type ProxyJobOpts } from "@ledgerhq/live-dmk-ws-proxy-server";

const args = [
  {
    name: "verbose",
    alias: "v",
    type: Boolean,
    desc: "verbose mode",
  },
  {
    name: "silent",
    alias: "s",
    type: Boolean,
    desc: "do not output the proxy logs",
  },
  {
    name: "port",
    alias: "p",
    type: String,
    desc: "specify the WebSocket proxy port to use (default: 8435)",
  },
];

const job = (opts: Partial<ProxyJobOpts>) => createProxyJob(opts);

export type { ProxyJobOpts };

export default {
  args,
  job,
};
