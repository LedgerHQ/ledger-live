// format: type:version:currencyId:address[:mode[:customData]][+tokenId]
const ACCOUNT_ID_RE = /[a-z][a-z0-9_]*:\d+:[^\s"',\]})]+/g;

export function redactAccountId(id: string): string {
  const plusIdx = id.lastIndexOf("+");
  const token = plusIdx !== -1 ? id.slice(plusIdx) : "";
  const fields = (plusIdx !== -1 ? id.slice(0, plusIdx) : id).split(":");
  if (fields.length < 5) return id;
  fields[3] = "[redacted]";
  if (fields[5]) fields[5] = "[redacted]";
  return fields.join(":") + token;
}

export function scrubAccountId(str: string): string {
  return str.replace(ACCOUNT_ID_RE, redactAccountId);
}
