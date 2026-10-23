#!/usr/bin/env node
// Lines up a runner-side packet capture with the launches in samples.jsonl. For each launch: the DNS
// lookups and HTTPS connections made in its first seconds, and when the answers WaitForAppReady
// waits for (remote flags, OFAC check) reached the runner, against when the app stopped waiting.
// Answers that arrive well before the app stops waiting mean the time goes inside the emulator
// (its network stack or CPU), not on the network. With per-launch captures from inside the
// emulator (run.mjs --guest-capture), the same requests are also timed from the emulator's side.
import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { median, robustSd } from "./analyze.mjs";
import { dnsLookups, readPcap, tcpConnections } from "./pcap.mjs";

const WINDOW_MS = 10_000;
// The requests WaitForAppReady waits for, by TLS server name. The OFAC check is GET /v3/markets on
// the countervalues service (LEDGER_COUNTERVALUES_API), whose host depends on the app version:
// countervalues.live.ledger.com now, global.api.prd.ledger.com/countervalue in builds before
// 1d51f35ac7b (e.g. the LIVE-36190 pair). Over HTTP/2 the request can also ride on a connection the
// app opened to another Ledger host, which this match by server name does not see.
export const GATES = [
  { label: "Remote flags", hosts: ["firebaseremoteconfig.googleapis.com"] },
  { label: "OFAC check", hosts: ["countervalues.live.ledger.com", "global.api.prd.ledger.com"] },
];

// A gate's connection, trying its hosts in order: a build that uses the first host can still open
// an unrelated connection to the second one.
const gateConnection = (g, connections) =>
  g.hosts.map(h => connections.find(c => c.sni === h)).find(Boolean);

// The runner's own traffic (job logs, artifacts) shares the capture.
const RUNNER_HOSTS =
  /(^|\.)(github\.com|githubusercontent\.com|githubapp\.com|blob\.core\.windows\.net)$/;

// One request split into steps, in ms: who spends each one is the point. Inside the emulator:
// DNS answer → connect, connected → TLS hello, server handshake → TLS finish, TLS finish → request.
// On the network: TCP connect, the server's first answer. On the server: request → answer.
export function requestSteps(c, lookups) {
  if (!c || c.failed) return null;
  const lookup = lookups.findLast(l => l.name === c.sni && l.ms !== null && l.at + l.ms <= c.synAt);
  const dnsAnswered =
    lookup && c.synAt - (lookup.at + lookup.ms) < 2000 ? lookup.at + lookup.ms : null;
  const serverHandshakeAt =
    c.helloAt !== null && c.firstAnswerMs !== null ? c.helloAt + c.firstAnswerMs : null;
  const diff = (a, b) =>
    a === null || a === undefined || b === null || b === undefined ? null : Math.round(a - b);
  return {
    dnsToConnectMs: diff(c.synAt, dnsAnswered),
    connectMs: c.connectMs,
    connectedToHelloMs: diff(c.helloAt, c.synAckAt),
    serverHandshakeMs: c.firstAnswerMs,
    clientHandshakeMs: diff(c.finishAt, serverHandshakeAt),
    finishToRequestMs: diff(c.requestAt, c.finishAt),
    serverResponseMs: diff(c.responseStart, c.requestAt),
    totalMs: diff(c.responseEnd, c.synAt),
  };
}

const STEPS = [
  ["dnsToConnectMs", "DNS answer → connection opened"],
  ["connectMs", "TCP connect"],
  ["connectedToHelloMs", "Connected → TLS hello sent"],
  ["serverHandshakeMs", "Server answers the hello"],
  ["clientHandshakeMs", "Server's answer → TLS finish sent"],
  ["finishToRequestMs", "TLS finish → request sent"],
  ["serverResponseMs", "Request → first byte of the answer"],
  ["totalMs", "**Connection start → answer received**"],
];

// guest(sample): the emulator-side { connections, lookups } of that launch, or null.
export function perLaunch(samples, connections, lookups, guest = () => null) {
  return samples
    .filter(s => s.ok && !s.warmup && Number.isFinite(s.launchAt))
    .map(s => {
      const inWindow = c => c.synAt >= s.launchAt - 200 && c.synAt <= s.launchAt + WINDOW_MS;
      const flows = connections.filter(c => inWindow(c) && !RUNNER_HOSTS.test(c.sni ?? ""));
      // Times count from the app's process start when run.mjs recorded it, like the startup events.
      const t0 = Number.isFinite(s.processStartAt) ? s.processStartAt : s.launchAt;
      const inside = guest(s);
      const gates = {};
      for (const g of GATES) {
        gates[g.label] = {
          runner: requestSteps(gateConnection(g, flows), lookups),
          emulator: inside
            ? requestSteps(gateConnection(g, inside.connections), inside.lookups)
            : null,
        };
      }
      const hosts = {};
      for (const c of flows) {
        const host = c.sni ?? c.server;
        if (hosts[host]) continue;
        const lookup = lookups.find(
          l => l.name === host && l.at >= s.launchAt - 200 && l.at <= c.synAt,
        );
        const after = t => (t === null ? null : Math.round(t - t0));
        hosts[host] = {
          startMs: after(c.synAt),
          dnsMs: lookup?.ms ?? null,
          // Time between the DNS answer and the connection: work inside the emulator, or a
          // connection attempt the runner never saw (e.g. IPv6 failing before IPv4).
          dnsToConnectMs:
            lookup && lookup.ms !== null ? Math.round(c.synAt - lookup.at - lookup.ms) : null,
          connectMs: c.connectMs,
          tlsMs: c.firstAnswerMs,
          answerStartMs: after(c.responseStart),
          answerEndMs: after(c.responseEnd),
          failed: c.failed,
        };
      }
      const gateEnds = GATES.map(g =>
        g.hosts.map(h => hosts[h]?.answerEndMs).find(Number.isFinite),
      );
      const waitStart = s.events?.["WaitForAppReady render"]?.time ?? null;
      const waitEnd = s.events?.["WaitForAppReady done"]?.time ?? null;
      const gatesAnsweredMs = gateEnds.every(Number.isFinite) ? Math.max(...gateEnds) : null;
      return {
        scenario: s.scenario,
        device: s.device,
        side: s.side,
        appStartupTime: s.appStartupTime,
        fromProcessStart: t0 !== s.launchAt,
        launchToProcessMs: t0 !== s.launchAt ? t0 - s.launchAt : null,
        // Event times count from process start.
        waitStartMs: waitStart,
        waitEndMs: waitEnd,
        gatesAnsweredMs,
        waitAfterAnswersMs:
          gatesAnsweredMs !== null && waitEnd !== null ? waitEnd - gatesAnsweredMs : null,
        connections: flows.length,
        failedConnections: flows.filter(c => c.failed).length,
        ipv6Connections: flows.filter(c => c.ipv6).length,
        gates,
        hosts,
        runnerNetwork: s.runnerNetwork ?? null,
      };
    });
}

const fmt = v => (Number.isFinite(v) ? String(Math.round(v)) : "–");
const stat = values => {
  const v = values.filter(Number.isFinite);
  return v.length ? `${fmt(median(v))} ±${fmt(robustSd(v))}` : "–";
};

export function toMarkdown(launches) {
  const lines = ["### Network during startup", ""];
  if (!launches.length)
    return lines.concat("No launch could be lined up with the capture.", "").join("\n");
  const fromStart = launches.every(l => l.fromProcessStart);
  const after = fromStart ? "after process start" : "after launch";
  lines.push(
    `Timed on the runner, which sees every connection of the emulator. Times in ms, median ± spread; “${after}” counts from ${fromStart ? "the app's process start, like the startup events" : "the launch command, a few hundred ms before the app's process exists"}.`,
    "",
    "| Scenario | Launches | Launch command → process start | App waits from → to | Remote flags + OFAC answered | App stops waiting after the answers | Connections / failed / IPv6 |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  );
  for (const scenario of [...new Set(launches.map(l => l.scenario))]) {
    const g = launches.filter(l => l.scenario === scenario);
    lines.push(
      `| ${scenario} | ${g.length} | ${stat(g.map(l => l.launchToProcessMs))} | ${stat(g.map(l => l.waitStartMs))} → ${stat(g.map(l => l.waitEndMs))} | ${stat(g.map(l => l.gatesAnsweredMs))} | ${fromStart ? stat(g.map(l => l.waitAfterAnswersMs)) : "–"} | ${fmt(median(g.map(l => l.connections)))} / ${g.reduce((a, l) => a + l.failedConnections, 0)} / ${g.reduce((a, l) => a + l.ipv6Connections, 0)} |`,
    );
  }
  const withEmulator = launches.some(l => GATES.some(g => l.gates[g.label]?.emulator));
  const views = withEmulator ? ["runner", "emulator"] : ["runner"];
  lines.push(
    "",
    `Requests the app waits for, step by step${withEmulator ? ", seen from the runner and from inside the emulator: the difference is the emulator's network layer" : ""}:`,
    "",
    `| Step | ${GATES.flatMap(g => views.map(v => `${g.label} (${v})`)).join(" | ")} |`,
    `| --- | ${GATES.flatMap(() => views.map(() => "---")).join(" | ")} |`,
  );
  for (const [key, label] of STEPS) {
    const cells = GATES.flatMap(g =>
      views.map(v => stat(launches.map(l => l.gates[g.label]?.[v]?.[key]))),
    );
    lines.push(`| ${label} | ${cells.join(" | ")} |`);
  }
  lines.push(
    "",
    `| Host (TLS name) | Launches | Starts ${after} | DNS | DNS → connect | TCP connect | TLS handshake | First answer ${after}: starts → ends | Failed |`,
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  );
  const counts = new Map();
  for (const l of launches)
    for (const h of Object.keys(l.hosts)) counts.set(h, (counts.get(h) ?? 0) + 1);
  const gateHosts = new Set(GATES.flatMap(g => g.hosts));
  const hosts = [...counts.entries()]
    .sort((a, b) => Number(gateHosts.has(b[0])) - Number(gateHosts.has(a[0])) || b[1] - a[1])
    .slice(0, 15);
  for (const [host] of hosts) {
    const rows = launches.map(l => l.hosts[host]).filter(Boolean);
    const gate = GATES.find(g => g.hosts.includes(host));
    lines.push(
      `| ${gate ? `**${host}** (${gate.label})` : host} | ${rows.length}/${launches.length} | ${stat(rows.map(r => r.startMs))} | ${stat(rows.map(r => r.dnsMs))} | ${stat(rows.map(r => r.dnsToConnectMs))} | ${stat(rows.map(r => r.connectMs))} | ${stat(rows.map(r => r.tlsMs))} | ${stat(rows.map(r => r.answerStartMs))} → ${stat(rows.map(r => r.answerEndMs))} | ${rows.filter(r => r.failed).length} |`,
    );
  }
  const urls = [...new Set(launches.flatMap(l => Object.keys(l.runnerNetwork ?? {})))];
  if (urls.length) {
    lines.push(
      "",
      "Same hosts from the runner itself (curl before each launch), for comparison:",
      "",
      "| URL | DNS | TCP connect | TLS handshake | First byte | Total | Failed |",
      "| --- | --- | --- | --- | --- | --- | --- |",
    );
    for (const url of urls) {
      const rows = launches.map(l => l.runnerNetwork?.[url]).filter(Boolean);
      const ok = rows.filter(r => !r.failed);
      lines.push(
        `| ${url} | ${stat(ok.map(r => r.dnsMs))} | ${stat(ok.map(r => r.connectMs))} | ${stat(ok.map(r => r.tlsMs))} | ${stat(ok.map(r => r.firstByteMs))} | ${stat(ok.map(r => r.totalMs))} | ${rows.length - ok.length} |`,
      );
    }
  }
  return lines.join("\n") + "\n";
}

async function main() {
  const { values } = parseArgs({
    options: {
      pcap: { type: "string" },
      samples: { type: "string" },
      summary: { type: "string" },
      json: { type: "string" },
    },
  });
  const samples = (await readFile(values.samples, "utf8"))
    .split("\n")
    .filter(l => l.trim())
    .map(l => JSON.parse(l));
  const packets = readPcap(await readFile(values.pcap));
  // Emulator-side captures, one per launch, recorded relative to the samples file's folder.
  const guestCaptures = new Map();
  for (const s of samples) {
    const file = s.guestPcap && path.join(path.dirname(values.samples), s.guestPcap);
    if (!file || !existsSync(file)) continue;
    const guestPackets = readPcap(await readFile(file));
    guestCaptures.set(s, {
      connections: tcpConnections(guestPackets),
      lookups: dnsLookups(guestPackets),
    });
  }
  const launches = perLaunch(
    samples,
    tcpConnections(packets),
    dnsLookups(packets),
    s => guestCaptures.get(s) ?? null,
  );
  const markdown = toMarkdown(launches);
  console.log(markdown);
  if (values.summary) await appendFile(values.summary, markdown + "\n");
  if (values.json) {
    await mkdir(path.dirname(values.json), { recursive: true });
    await writeFile(values.json, JSON.stringify(launches, null, 2));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
