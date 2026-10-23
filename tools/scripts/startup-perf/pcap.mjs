// Dependency-free reader for the packet captures of the startup spike (tcpdump -i any on the runner):
// DNS lookups and TCP connections with their TLS server name (SNI), timed in ms since the epoch.
// With the emulator's user-mode network, every guest connection is a plain socket of the emulator
// process on the runner, so the runner sees the real network side of each request.

const LINK_ETHERNET = 1;
const LINK_RAW = 101;
const LINK_LINUX_SLL = 113;
const LINK_LINUX_SLL2 = 276;

// Splits a pcap file into IP packets. Supports the link types tcpdump writes for one interface
// (Ethernet, raw IP) and for "-i any" (Linux cooked v1 and v2).
export function readPcap(buffer) {
  const magic = buffer.readUInt32LE(0);
  const little = magic === 0xa1b2c3d4 || magic === 0xa1b23c4d;
  if (!little && buffer.readUInt32BE(0) !== 0xa1b2c3d4 && buffer.readUInt32BE(0) !== 0xa1b23c4d) {
    throw new Error("not a pcap file");
  }
  const u32 = offset => (little ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset));
  const nanos = (little ? magic : buffer.readUInt32BE(0)) === 0xa1b23c4d;
  const linkType = u32(20) & 0xffff;
  const packets = [];
  for (let offset = 24; offset + 16 <= buffer.length;) {
    const seconds = u32(offset);
    const fraction = u32(offset + 4);
    const captured = u32(offset + 8);
    const data = buffer.subarray(offset + 16, offset + 16 + captured);
    offset += 16 + captured;
    const ip = ipPayload(linkType, data);
    if (!ip) continue;
    const packet = parseIp(ip);
    if (packet) {
      packet.ts = seconds * 1000 + (nanos ? fraction / 1e6 : fraction / 1e3);
      packets.push(packet);
    }
  }
  return packets;
}

function ipPayload(linkType, data) {
  let protocol;
  let start;
  if (linkType === LINK_ETHERNET) {
    protocol = data.readUInt16BE(12);
    start = 14;
    if (protocol === 0x8100 && data.length >= 18) {
      protocol = data.readUInt16BE(16);
      start = 18;
    }
  } else if (linkType === LINK_LINUX_SLL) {
    protocol = data.readUInt16BE(14);
    start = 16;
  } else if (linkType === LINK_LINUX_SLL2) {
    protocol = data.readUInt16BE(0);
    start = 20;
  } else if (linkType === LINK_RAW) {
    return data;
  } else {
    throw new Error(`unsupported pcap link type ${linkType}`);
  }
  return protocol === 0x0800 || protocol === 0x86dd ? data.subarray(start) : null;
}

const ipv4 = (b, o) => `${b[o]}.${b[o + 1]}.${b[o + 2]}.${b[o + 3]}`;
const ipv6 = (b, o) =>
  Array.from({ length: 8 }, (_, i) => b.readUInt16BE(o + i * 2).toString(16)).join(":");

function parseIp(b) {
  if (b.length < 20) return null;
  const version = b[0] >> 4;
  let protocol;
  let src;
  let dst;
  let headerLength;
  let totalLength;
  if (version === 4) {
    headerLength = (b[0] & 0x0f) * 4;
    totalLength = b.readUInt16BE(2);
    protocol = b[9];
    src = ipv4(b, 12);
    dst = ipv4(b, 16);
  } else if (version === 6 && b.length >= 40) {
    headerLength = 40;
    totalLength = 40 + b.readUInt16BE(4);
    protocol = b[6];
    src = ipv6(b, 8);
    dst = ipv6(b, 24);
  } else {
    return null;
  }
  const l4 = b.subarray(headerLength);
  const l4Length = totalLength - headerLength;
  if (protocol === 6 && l4.length >= 20) {
    const dataOffset = (l4[12] >> 4) * 4;
    const flags = l4[13];
    return {
      version,
      proto: "tcp",
      src,
      dst,
      sport: l4.readUInt16BE(0),
      dport: l4.readUInt16BE(2),
      syn: !!(flags & 0x02),
      ack: !!(flags & 0x10),
      fin: !!(flags & 0x01),
      rst: !!(flags & 0x04),
      payloadLength: Math.max(0, l4Length - dataOffset),
      payload: l4.subarray(dataOffset),
    };
  }
  if (protocol === 17 && l4.length >= 8) {
    return {
      version,
      proto: "udp",
      src,
      dst,
      sport: l4.readUInt16BE(0),
      dport: l4.readUInt16BE(2),
      payloadLength: l4Length - 8,
      payload: l4.subarray(8),
    };
  }
  return null;
}

// Server name from a TLS ClientHello at the start of a TCP payload, or null.
export function tlsServerName(p) {
  try {
    if (p.length < 44 || p[0] !== 0x16 || p[5] !== 0x01) return null;
    let o = 5 + 4 + 2 + 32;
    o += 1 + p[o];
    o += 2 + p.readUInt16BE(o);
    o += 1 + p[o];
    const end = Math.min(p.length, o + 2 + p.readUInt16BE(o));
    o += 2;
    while (o + 4 <= end) {
      const type = p.readUInt16BE(o);
      const length = p.readUInt16BE(o + 2);
      if (type === 0 && o + 9 <= end) {
        const nameLength = p.readUInt16BE(o + 7);
        return p.subarray(o + 9, o + 9 + nameLength).toString("latin1");
      }
      o += 4 + length;
    }
  } catch {
    // Truncated ClientHello: no name.
  }
  return null;
}

function dnsQuestion(p) {
  if (p.length < 12) return null;
  const labels = [];
  let o = 12;
  while (o < p.length && p[o] !== 0) {
    if ((p[o] & 0xc0) !== 0) return null;
    labels.push(p.subarray(o + 1, o + 1 + p[o]).toString("latin1"));
    o += 1 + p[o];
  }
  if (o + 3 > p.length) return null;
  const qtype = p.readUInt16BE(o + 1);
  return {
    id: p.readUInt16BE(0),
    response: !!(p[2] & 0x80),
    rcode: p[3] & 0x0f,
    answers: p.readUInt16BE(6),
    name: labels.join("."),
    type: qtype === 1 ? "A" : qtype === 28 ? "AAAA" : String(qtype),
  };
}

// DNS lookups (UDP or TCP-less only) paired query → response.
export function dnsLookups(packets) {
  const pending = new Map();
  const lookups = [];
  for (const p of packets) {
    if (p.proto !== "udp" || (p.sport !== 53 && p.dport !== 53)) continue;
    const q = dnsQuestion(p.payload);
    if (!q) continue;
    if (!q.response) {
      const key = `${q.id}|${q.name}|${q.type}|${p.src}|${p.sport}`;
      if (!pending.has(key))
        pending.set(key, { name: q.name, type: q.type, at: p.ts, server: p.dst });
    } else {
      const key = `${q.id}|${q.name}|${q.type}|${p.dst}|${p.dport}`;
      const query = pending.get(key);
      if (!query) continue;
      pending.delete(key);
      lookups.push({ ...query, ms: p.ts - query.at, rcode: q.rcode, answers: q.answers });
    }
  }
  for (const query of pending.values())
    lookups.push({ ...query, ms: null, rcode: null, answers: 0 });
  return lookups.sort((a, b) => a.at - b.at);
}

// Server bursts end after this much silence: the first one after the request is its response.
const BURST_GAP_MS = 300;

// TCP connections opened in the capture, keyed by who sent the SYN, with:
// connect (SYN → SYN-ACK), firstAnswer (ClientHello → first server data, the TLS handshake round
// trip), finishAt (the client's next data: its TLS finish), requestAt (its first request after
// that), responseStart / responseEnd (the server burst that follows the request: its answer),
// and failed when no SYN-ACK ever came.
export function tcpConnections(packets) {
  const flows = new Map();
  const closed = [];
  for (const p of packets) {
    if (p.proto !== "tcp") continue;
    const forward = `${p.src}|${p.sport}|${p.dst}|${p.dport}`;
    const backward = `${p.dst}|${p.dport}|${p.src}|${p.sport}`;
    if (p.syn && !p.ack) {
      // Ports get reused over a long capture: a SYN on a pair that already connected, or whose
      // SYN went unanswered for a while, opens a new connection. Otherwise it is a retransmission.
      const existing = flows.get(forward);
      if (existing && (existing.synAckAt || p.ts - existing.synAt > 5000)) {
        closed.push(existing);
        flows.delete(forward);
      }
      if (!flows.has(forward)) {
        flows.set(forward, {
          client: `${p.src}:${p.sport}`,
          server: p.dst,
          port: p.dport,
          ipv6: p.version === 6,
          synAt: p.ts,
          packets: [],
        });
      }
      continue;
    }
    const flow = flows.get(forward) ?? flows.get(backward);
    if (!flow) continue;
    const fromClient = flows.has(forward);
    if (p.syn && p.ack && !fromClient) flow.synAckAt ??= p.ts;
    if (p.rst) flow.rstAt ??= p.ts;
    if (p.payloadLength > 0) flow.packets.push({ ts: p.ts, fromClient, payload: p.payload });
  }
  return [...closed, ...flows.values()].map(summariseFlow).sort((a, b) => a.synAt - b.synAt);
}

// A request is the first client packet this big after the TLS finish: smaller ones are the TLS
// finish itself and HTTP/2 setup (preface, settings, window updates).
const MIN_REQUEST_BYTES = 150;

function summariseFlow(flow) {
  const { packets, ...rest } = flow;
  const hello = packets.find(p => p.fromClient);
  const firstServer = packets.find(p => !p.fromClient);
  const finish = firstServer && packets.find(p => p.fromClient && p.ts > firstServer.ts);
  const request =
    finish &&
    packets.find(p => p.fromClient && p.ts > finish.ts && p.payload.length >= MIN_REQUEST_BYTES);
  let responseStart = null;
  let responseEnd = null;
  if (request) {
    for (const p of packets) {
      if (p.fromClient || p.ts <= request.ts) continue;
      if (responseEnd !== null && p.ts - responseEnd > BURST_GAP_MS) break;
      responseStart ??= p.ts;
      responseEnd = p.ts;
    }
  }
  return {
    ...rest,
    sni: hello ? tlsServerName(hello.payload) : null,
    failed: !flow.synAckAt,
    connectMs: flow.synAckAt ? flow.synAckAt - flow.synAt : null,
    helloAt: hello?.ts ?? null,
    firstAnswerMs: hello && firstServer ? firstServer.ts - hello.ts : null,
    finishAt: finish?.ts ?? null,
    requestAt: request?.ts ?? null,
    responseStart,
    responseEnd,
  };
}
