#!/usr/bin/env node
// Lines up a runner-side packet capture with the launches in samples.jsonl. For each launch: the DNS
// lookups and HTTPS connections made in its first seconds, and when the answers WaitForAppReady
// waits for (remote flags, OFAC check) reached the runner, against when the app stopped waiting.
// Answers that arrive well before the app stops waiting mean the time goes inside the emulator
// (its network stack or CPU), not on the network.
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { median, robustSd } from "./analyze.mjs";
import { dnsLookups, readPcap, tcpConnections } from "./pcap.mjs";

const WINDOW_MS = 10_000;
// The requests WaitForAppReady waits for, by TLS server name. The OFAC check is GET /v3/markets on
// the countervalues service, the first request the app sends to that host at startup.
export const GATES = [
  { label: "Remote flags", host: "firebaseremoteconfig.googleapis.com" },
  { label: "OFAC check", host: "global.api.prd.ledger.com" },
];

// The runner's own traffic (job logs, artifacts) shares the capture.
const RUNNER_HOSTS =
  /(^|\.)(github\.com|githubusercontent\.com|githubapp\.com|blob\.core\.windows\.net)$/;

export function perLaunch(samples, connections, lookups) {
  return samples
    .filter(s => s.ok && !s.warmup && Number.isFinite(s.launchAt))
    .map(s => {
      const inWindow = c => c.synAt >= s.launchAt - 200 && c.synAt <= s.launchAt + WINDOW_MS;
      const flows = connections.filter(c => inWindow(c) && !RUNNER_HOSTS.test(c.sni ?? ""));
      const hosts = {};
      for (const c of flows) {
        const host = c.sni ?? c.server;
        if (hosts[host]) continue;
        const lookup = lookups.find(
          l => l.name === host && l.at >= s.launchAt - 200 && l.at <= c.synAt,
        );
        const after = t => (t === null ? null : Math.round(t - s.launchAt));
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
      const gateEnds = GATES.map(g => hosts[g.host]?.answerEndMs);
      const waitStart = s.events?.["WaitForAppReady render"]?.time ?? null;
      const waitEnd = s.events?.["WaitForAppReady done"]?.time ?? null;
      const gatesAnsweredMs = gateEnds.every(Number.isFinite) ? Math.max(...gateEnds) : null;
      return {
        scenario: s.scenario,
        device: s.device,
        side: s.side,
        appStartupTime: s.appStartupTime,
        // Event times count from process start, which follows the launch command by a few ms.
        waitStartMs: waitStart,
        waitEndMs: waitEnd,
        gatesAnsweredMs,
        waitAfterAnswersMs:
          gatesAnsweredMs !== null && waitEnd !== null ? waitEnd - gatesAnsweredMs : null,
        connections: flows.length,
        failedConnections: flows.filter(c => c.failed).length,
        ipv6Connections: flows.filter(c => c.ipv6).length,
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
  lines.push(
    "Timed on the runner, which sees every connection of the emulator. Times in ms, median ± spread; “after launch” counts from the launch command.",
    "",
    "| Scenario | Launches | App waits from → to | Remote flags + OFAC answered | App stops waiting after the answers | Connections / failed / IPv6 |",
    "| --- | --- | --- | --- | --- | --- |",
  );
  for (const scenario of [...new Set(launches.map(l => l.scenario))]) {
    const g = launches.filter(l => l.scenario === scenario);
    lines.push(
      `| ${scenario} | ${g.length} | ${stat(g.map(l => l.waitStartMs))} → ${stat(g.map(l => l.waitEndMs))} | ${stat(g.map(l => l.gatesAnsweredMs))} | ${stat(g.map(l => l.waitAfterAnswersMs))} | ${fmt(median(g.map(l => l.connections)))} / ${g.reduce((a, l) => a + l.failedConnections, 0)} / ${g.reduce((a, l) => a + l.ipv6Connections, 0)} |`,
    );
  }
  lines.push(
    "",
    "| Host (TLS name) | Launches | Starts after launch | DNS | DNS → connect | TCP connect | TLS handshake | First answer after launch: starts → ends | Failed |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  );
  const counts = new Map();
  for (const l of launches)
    for (const h of Object.keys(l.hosts)) counts.set(h, (counts.get(h) ?? 0) + 1);
  const gateHosts = new Set(GATES.map(g => g.host));
  const hosts = [...counts.entries()]
    .sort((a, b) => Number(gateHosts.has(b[0])) - Number(gateHosts.has(a[0])) || b[1] - a[1])
    .slice(0, 15);
  for (const [host] of hosts) {
    const rows = launches.map(l => l.hosts[host]).filter(Boolean);
    const gate = GATES.find(g => g.host === host);
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
  const launches = perLaunch(samples, tcpConnections(packets), dnsLookups(packets));
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
