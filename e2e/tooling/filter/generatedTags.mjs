// Vocabulary of e2e tags that specs attach at *runtime* rather than spelling out literally.
//
// `buildTags({ currencyId })` (e2e/desktop/tests/utils/tagsUtils.ts) derives `@<currencyId>`,
// `@family-<family>` and the device tags at collection time, so those strings never appear in
// the spec source. A purely textual "does this filter match a spec?" check therefore cannot
// observe them and would report a false "matched 0 specs" for a perfectly valid filter.
//
// This module lets the zero-match check tell those two cases apart:
//   - a known runtime-generated tag -> unverifiable statically, not an error
//   - anything else                 -> most likely a typo, still worth warning about
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { stripLeafAnchor, unescapeLiteral } from "./escaping.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../../..");

// One file per crypto currency, each declaring `id:` and `family:` — the same values
// `getFamilyByCurrencyId` resolves at runtime, so this is the authoritative tag vocabulary.
const CRYPTO_CURRENCIES_DIR = path.join(repoRoot, "domain/entity/currency-crypto/src/currencies");
const DEVICE_TAGS_FILE = path.join(repoRoot, "e2e/desktop/tests/utils/tagsUtils.ts");

const FAMILY_TAG_PREFIX = "family-";
const ID_PATTERN = /^\s*id:\s*"([^"]+)"/m;
const FAMILY_PATTERN = /^\s*family:\s*"([^"]+)"/m;
const DEVICE_TAGS_PATTERN = /DEVICE_TAGS\s*=\s*\[([^\]]*)\]/;

function readCurrencyVocabulary() {
  const currencyIds = new Set();
  const families = new Set();

  let entries;
  try {
    entries = fs.readdirSync(CRYPTO_CURRENCIES_DIR);
  } catch {
    return { currencyIds, families };
  }

  for (const entry of entries) {
    if (!entry.endsWith(".ts") || entry.endsWith(".test.ts")) continue;

    let content;
    try {
      content = fs.readFileSync(path.join(CRYPTO_CURRENCIES_DIR, entry), "utf8");
    } catch {
      continue;
    }

    const id = content.match(ID_PATTERN)?.[1];
    const family = content.match(FAMILY_PATTERN)?.[1];
    if (id) currencyIds.add(id.toLowerCase());
    if (family) families.add(family.toLowerCase());
  }

  return { currencyIds, families };
}

function readDeviceTags() {
  const deviceTags = new Set();
  try {
    const content = fs.readFileSync(DEVICE_TAGS_FILE, "utf8");
    const block = content.match(DEVICE_TAGS_PATTERN)?.[1] ?? "";
    for (const literal of block.match(/["'`]@[\w-]+["'`]/g) ?? []) {
      deviceTags.add(literal.slice(1, -1).toLowerCase());
    }
  } catch {
    // A missing/renamed tagsUtils only shrinks the vocabulary; the caller still warns.
  }
  return deviceTags;
}

let cachedVocabulary;

export function readTagVocabulary() {
  if (!cachedVocabulary) {
    const { currencyIds, families } = readCurrencyVocabulary();
    cachedVocabulary = { currencyIds, families, deviceTags: readDeviceTags() };
  }
  return cachedVocabulary;
}

// True when `part` is a tag the specs can only produce at runtime, so its absence from the
// spec text proves nothing about whether the run will select tests.
export function isRuntimeGeneratedTag(part, vocabulary = readTagVocabulary()) {
  const token = unescapeLiteral(stripLeafAnchor(String(part)))
    .trim()
    .toLowerCase();
  if (!token.startsWith("@")) return false;

  const { currencyIds, families, deviceTags } = vocabulary;
  if (deviceTags.has(token)) return true;

  const name = token.slice(1);
  if (name.startsWith(FAMILY_TAG_PREFIX)) {
    return families.has(name.slice(FAMILY_TAG_PREFIX.length));
  }
  return currencyIds.has(name);
}
