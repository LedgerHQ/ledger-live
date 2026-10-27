import type { PiiFinding, PiiKind } from "../../types";

type Scrubbed<T> = {
  value: T;
  findings: PiiFinding[];
};

type ValuePattern = {
  kind: PiiKind;
  regex: RegExp;
  replace: (match: string, ...groups: string[]) => string | null;
};

const MAX_DEPTH = 8;

const redacted = (kind: PiiKind) => `[REDACTED:${kind}]`;

const MOVE_TOKEN_ID = /^[a-z][a-z0-9_]*\/[a-z0-9_]+\/0x[0-9a-f]+::\w+::\w+$/i;

const SENSITIVE_KEYS = new Set([
  "address",
  "freshaddress",
  "xpub",
  "publickey",
  "pubkey",
  "signature",
  "txhash",
  "transactionhash",
  "privatekey",
  "mnemonic",
  "seed",
  "email",
  "rawdata",
  "rawtx",
]);

function redactLedgerAccountId(id: string): string {
  const fields = id.split(":");
  fields[3] = redacted("ledger_account_id");
  if (fields[5]) fields[5] = redacted("ledger_account_id");
  return fields.join(":");
}

const LINK_ID = /([/=])([A-Za-z0-9]{20,}|0\.0\.\d+[\w@.-]*|[\w.-]{2,64}\.near)(?![\w-]|\.\w)/g;

function redactLinkIds(link: string): string | null {
  const value = link.replace(
    LINK_ID,
    (_match, separator) => `${separator}${redacted("explorer_url")}`,
  );
  return value === link ? null : value;
}

const VALUE_PATTERNS: ValuePattern[] = [
  {
    kind: "ledger_account_id",
    regex: /\b(?:js|libcore|ethereumjs):\d+:[\w.-]+:[^\s:"',\]})]+:\w*(?::[^\s:"',\]})]+)?/g,
    replace: redactLedgerAccountId,
  },
  {
    kind: "explorer_url",
    regex: /\bhttps?:\/\/[^\s"']+/gi,
    replace: redactLinkIds,
  },
  {
    kind: "evm_hash",
    regex: /\b0x[0-9a-fA-F]{64}\b/g,
    replace: () => redacted("evm_hash"),
  },
  {
    kind: "evm_address",
    regex: /\b0x[0-9a-fA-F]{40}\b/g,
    replace: () => redacted("evm_address"),
  },
  {
    kind: "extended_public_key",
    regex: /\b[xyztuvYZUV]pub[1-9A-HJ-NP-Za-km-z]{100,108}\b/g,
    replace: () => redacted("extended_public_key"),
  },
  {
    kind: "bech32_address",
    regex: /\b[a-z][a-z0-9_]{0,14}1[02-9ac-hj-np-z]{38,}\b/gi,
    replace: () => redacted("bech32_address"),
  },
  {
    kind: "email",
    regex: /\b[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,63}\b/g,
    replace: () => redacted("email"),
  },
];

export function scrubPiiString(input: string): { value: string; kinds: PiiKind[] } {
  if (MOVE_TOKEN_ID.test(input)) {
    return { value: input, kinds: [] };
  }

  const kinds: PiiKind[] = [];
  let value = input;

  for (const { kind, regex, replace } of VALUE_PATTERNS) {
    value = value.replace(regex, (match: string, ...groups: string[]) => {
      const replacement = replace(match, ...groups);
      if (replacement === null) return match;
      if (!kinds.includes(kind)) kinds.push(kind);
      return replacement;
    });
  }

  return { value, kinds };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

function hasContent(value: unknown): boolean {
  if (typeof value === "string") return value.length > 0;
  return isObject(value);
}

function scrubAt(value: unknown, path: string, depth: number, findings: PiiFinding[]): unknown {
  if (typeof value === "string") {
    const scrubbed = scrubPiiString(value);
    for (const kind of scrubbed.kinds) findings.push({ path, kind });
    return scrubbed.value;
  }

  if (depth >= MAX_DEPTH && isObject(value)) {
    findings.push({ path, kind: "max_depth" });
    return redacted("max_depth");
  }

  if (isObject(value) && typeof value.toJSON === "function") {
    const count = findings.length;
    const next = scrubAt(value.toJSON(), path, depth + 1, findings);
    return findings.length > count ? next : value;
  }

  if (Array.isArray(value)) {
    let changed = false;
    const items = value.map((item, index) => {
      const next = scrubAt(item, `${path}[${index}]`, depth + 1, findings);
      if (next !== item) changed = true;
      return next;
    });
    return changed ? items : value;
  }

  if (isObject(value)) {
    let changed = false;
    const entries = Object.entries(value).map(([rawKey, item]) => {
      const { value: key, kinds } = scrubPiiString(rawKey);
      const itemPath = path ? `${path}.${key}` : key;
      for (const kind of kinds) findings.push({ path: itemPath, kind });
      if (kinds.length > 0) changed = true;
      if (isSensitiveKey(key) && hasContent(item)) {
        findings.push({ path: itemPath, kind: "sensitive_key" });
        changed = true;
        return [key, redacted("sensitive_key")];
      }
      const next = scrubAt(item, itemPath, depth + 1, findings);
      if (next !== item) changed = true;
      return [key, next];
    });
    return changed ? Object.fromEntries(entries) : value;
  }

  return value;
}

export function scrubPii<T>(value: T, path = ""): Scrubbed<T> {
  const findings: PiiFinding[] = [];
  const scrubbed = scrubAt(value, path, 0, findings) as T;
  return { value: scrubbed, findings };
}
