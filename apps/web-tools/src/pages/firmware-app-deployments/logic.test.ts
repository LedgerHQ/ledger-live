import {
  buildMatrix,
  devicesInMatrix,
  errorMessage,
  incompleteCollectionNotice,
  isUsableMatrix,
  parseDeviceSelection,
  serialiseDeviceSelection,
  isStale,
  formatInstant,
  matchesFilter,
  pickFirmwareTracks,
  planSlots,
  rankFirmware,
  repoFromSourceUrl,
} from "./logic";
import { STALE_DAYS } from "./constants";
import type { CatalogEntry, DeviceVersion, FinalFirmwareVersion, Matrix, Slot } from "./types";

const firmware = (
  name: string,
  device_versions: number[] = [16],
  providers: number[] = [1],
): FinalFirmwareVersion => ({ name, device_versions, providers });

describe("isStale", () => {
  it("accepts a timestamp inside the staleness window", () => {
    const recent = new Date(Date.now() - (STALE_DAYS - 1) * 86_400_000).toISOString();
    expect(isStale(recent)).toBe(false);
  });

  it("rejects a timestamp older than the staleness window", () => {
    const old = new Date(Date.now() - (STALE_DAYS + 1) * 86_400_000).toISOString();
    expect(isStale(old)).toBe(true);
  });
});

describe("formatInstant", () => {
  it("keeps the UTC date and minutes, dropping seconds and the T separator", () => {
    expect(formatInstant("2026-09-11T08:34:57.123Z")).toBe("2026-09-11 08:34");
  });
});

describe("rankFirmware", () => {
  it("puts stable releases ahead of prereleases of a higher version", () => {
    const ranked = rankFirmware([firmware("1.6.0-rc1"), firmware("1.5.0")]);
    expect(ranked.map(version => version.name)).toEqual(["1.5.0", "1.6.0-rc1"]);
  });

  it("orders stable releases by version, newest first", () => {
    const ranked = rankFirmware([firmware("1.5.0"), firmware("1.10.0"), firmware("1.6.0")]);
    expect(ranked.map(version => version.name)).toEqual(["1.10.0", "1.6.0", "1.5.0"]);
  });

  it("orders prereleases naturally, so rc10 outranks rc2", () => {
    const ranked = rankFirmware([firmware("1.6.0-rc2"), firmware("1.6.0-rc10")]);
    expect(ranked.map(version => version.name)).toEqual(["1.6.0-rc10", "1.6.0-rc2"]);
  });

  it("drops entries with no parsable version core", () => {
    const ranked = rankFirmware([firmware("nightly"), firmware("1.5.0")]);
    expect(ranked.map(version => version.name)).toEqual(["1.5.0"]);
  });
});

describe("pickFirmwareTracks", () => {
  it("takes the newest stable as current and the prerelease above it as next", () => {
    const ranked = rankFirmware([firmware("1.6.0-rc1"), firmware("1.5.0"), firmware("1.4.0")]);
    const { current, next } = pickFirmwareTracks(ranked);

    expect(current?.name).toBe("1.5.0");
    expect(next?.name).toBe("1.6.0-rc1");
  });

  it("reports no next track when every prerelease is below the newest stable", () => {
    const ranked = rankFirmware([firmware("1.5.0"), firmware("1.4.0-rc3")]);
    const { current, next } = pickFirmwareTracks(ranked);

    expect(current?.name).toBe("1.5.0");
    expect(next).toBeNull();
  });

  it("reports no tracks at all when nothing stable is published", () => {
    expect(pickFirmwareTracks(rankFirmware([firmware("1.6.0-rc1")]))).toEqual({
      current: null,
      next: null,
    });
  });
});

describe("repoFromSourceUrl", () => {
  it.each([
    ["https://github.com/LedgerHQ/app-concordium", "LedgerHQ/app-concordium"],
    ["https://github.com/LedgerHQ/app-concordium.git", "LedgerHQ/app-concordium"],
    ["https://github.com/LedgerHQ/app-concordium/tree/develop", "LedgerHQ/app-concordium"],
  ])("reads %s as %s", (sourceUrl, expected) => {
    expect(repoFromSourceUrl(sourceUrl)).toBe(expected);
  });

  it.each([undefined, "", "https://gitlab.com/LedgerHQ/app-concordium"])(
    "returns null for %s",
    sourceUrl => {
      expect(repoFromSourceUrl(sourceUrl)).toBeNull();
    },
  );
});

describe("planSlots", () => {
  const deviceVersions: DeviceVersion[] = [{ id: 16, target_id: 856686596, providers: [1, 4] }];

  it("plans a current and a next slot per provider the device supports", () => {
    const slots = planSlots(
      deviceVersions,
      [firmware("1.5.0", [16], [1, 4]), firmware("1.6.0-rc1", [16], [1, 4])],
      () => {},
    );

    expect(slots.map(slot => slot.key)).toEqual([
      "nanosp/P1/current",
      "nanosp/P1/next",
      "nanosp/P4/current",
      "nanosp/P4/next",
    ]);
  });

  it("gives the current slot every stable release as a fallback, newest first", () => {
    const slots = planSlots(
      deviceVersions,
      [firmware("1.5.0"), firmware("1.4.0"), firmware("1.6.0-rc1")],
      () => {},
    );
    const current = slots.find(slot => slot.track === "current")!;

    expect(current.candidates.map(version => version.name)).toEqual(["1.5.0", "1.4.0"]);
    expect(current.mayBeEmpty).toBe(false);
  });

  it("gives the next slot exactly one candidate and lets it come back empty", () => {
    const slots = planSlots(deviceVersions, [firmware("1.5.0"), firmware("1.6.0-rc1")], () => {});
    const next = slots.find(slot => slot.track === "next")!;

    expect(next.candidates.map(version => version.name)).toEqual(["1.6.0-rc1"]);
    expect(next.mayBeEmpty).toBe(true);
  });

  it("skips providers the device does not list", () => {
    const slots = planSlots(
      [{ id: 16, target_id: 856686596, providers: [1] }],
      [firmware("1.5.0", [16], [1, 4])],
      () => {},
    );

    expect(slots.every(slot => slot.provider.label === "P1")).toBe(true);
  });

  it("warns and skips when a device is absent from device_versions", () => {
    const warnings: string[] = [];
    const slots = planSlots([], [firmware("1.5.0")], message => warnings.push(message));

    expect(slots).toEqual([]);
    expect(warnings).toContain("device Nano X (id 9) absent from device_versions");
  });

  it("warns and skips a provider with no stable firmware", () => {
    const warnings: string[] = [];
    const slots = planSlots(
      [{ id: 16, target_id: 856686596, providers: [1] }],
      [firmware("1.6.0-rc1")],
      message => warnings.push(message),
    );

    expect(slots).toEqual([]);
    expect(warnings).toContain("nanosp/P1: no stable firmware listed — slot skipped");
  });
});

describe("buildMatrix", () => {
  const slot = (key: string, deviceKey: string, provider: string, track: "current" | "next") =>
    ({
      key,
      device: { id: 16, key: deviceKey, label: deviceKey },
      provider: { id: provider === "P1" ? 1 : 4, label: provider },
      targetId: 856686596,
      track,
      candidates: [],
      mayBeEmpty: track === "next",
    }) as Slot;

  const entry = (overrides: Partial<CatalogEntry> = {}): CatalogEntry => ({
    versionName: "Concordium",
    versionDisplayName: "Concordium",
    version: "1.0.0",
    sourceURL: "https://github.com/LedgerHQ/app-concordium",
    dateModified: "2026-08-01T09:00:00Z",
    ...overrides,
  });

  it("folds one app seen on two slots into a single row with both versions", () => {
    const matrix = buildMatrix(
      [
        {
          slot: slot("nanosp/P1/current", "nanosp", "P1", "current"),
          result: { firmware: "1.5.0", catalog: [entry()] },
        },
        {
          slot: slot("nanosp/P4/current", "nanosp", "P4", "current"),
          result: { firmware: "1.5.0", catalog: [entry({ version: "1.1.0" })] },
        },
      ],
      [],
    );

    expect(matrix.apps).toHaveLength(1);
    expect(matrix.apps[0].versions).toEqual({
      "nanosp/P1/current": { version: "1.0.0", modified: "2026-08-01" },
      "nanosp/P4/current": { version: "1.1.0", modified: "2026-08-01" },
    });
    expect(matrix.apps[0].repo).toBe("LedgerHQ/app-concordium");
  });

  it("orders columns by provider, and a provider's current track before its next", () => {
    const matrix = buildMatrix(
      [
        {
          slot: slot("nanosp/P4/next", "nanosp", "P4", "next"),
          result: { firmware: "1.6.0-rc1", catalog: [entry()] },
        },
        {
          slot: slot("nanosp/P4/current", "nanosp", "P4", "current"),
          result: { firmware: "1.5.0", catalog: [entry()] },
        },
        {
          slot: slot("nanosp/P1/current", "nanosp", "P1", "current"),
          result: { firmware: "1.5.0", catalog: [entry()] },
        },
      ],
      [],
    );

    expect(matrix.columns.nanosp.map(column => column.key)).toEqual([
      "nanosp/P1/current",
      "nanosp/P4/current",
      "nanosp/P4/next",
    ]);
  });

  it("keeps the first non-empty sourceURL when another slot omits it", () => {
    const matrix = buildMatrix(
      [
        {
          slot: slot("nanosp/P1/current", "nanosp", "P1", "current"),
          result: { firmware: "1.5.0", catalog: [entry({ sourceURL: "" })] },
        },
        {
          slot: slot("nanosp/P4/current", "nanosp", "P4", "current"),
          result: { firmware: "1.5.0", catalog: [entry()] },
        },
      ],
      [],
    );

    expect(matrix.apps[0].repo).toBe("LedgerHQ/app-concordium");
  });

  it("sorts apps by display name", () => {
    const matrix = buildMatrix(
      [
        {
          slot: slot("nanosp/P1/current", "nanosp", "P1", "current"),
          result: {
            firmware: "1.5.0",
            catalog: [
              entry({ versionName: "Zcash", versionDisplayName: "Zcash" }),
              entry({ versionName: "Aptos", versionDisplayName: "Aptos" }),
            ],
          },
        },
      ],
      [],
    );

    expect(matrix.apps.map(app => app.name)).toEqual(["Aptos", "Zcash"]);
  });

  it("falls back to versionName when the catalog has no display name", () => {
    const matrix = buildMatrix(
      [
        {
          slot: slot("nanosp/P1/current", "nanosp", "P1", "current"),
          result: { firmware: "1.5.0", catalog: [entry({ versionDisplayName: undefined })] },
        },
      ],
      [],
    );

    expect(matrix.apps[0].name).toBe("Concordium");
  });

  it("keys columns by device and carries the warnings through", () => {
    const matrix = buildMatrix(
      [
        {
          slot: slot("stax/P1/current", "stax", "P1", "current"),
          result: { firmware: "1.5.0", catalog: [entry()] },
        },
        {
          slot: slot("nanosp/P1/current", "nanosp", "P1", "current"),
          result: { firmware: "1.5.0", catalog: [entry()] },
        },
      ],
      ["something was skipped"],
    );

    expect(Object.keys(matrix.columns).sort()).toEqual(["nanosp", "stax"]);
    expect(matrix.warnings).toEqual(["something was skipped"]);
  });
});

describe("devicesInMatrix", () => {
  it("returns devices in DEVICES order, not the order the matrix was built in", () => {
    const devices = devicesInMatrix({ stax: [], nanosp: [], nanox: [] });
    expect(devices.map(device => device.key)).toEqual(["nanosp", "nanox", "stax"]);
  });

  it("labels devices from the configuration rather than from the data", () => {
    expect(devicesInMatrix({ apex: [] })).toEqual([{ key: "apex", label: "Gen5" }]);
  });

  it("drops a device the configuration no longer lists, as a stale cache would hold", () => {
    expect(devicesInMatrix({ nanosp: [], blue: [] }).map(device => device.key)).toEqual(["nanosp"]);
  });

  it("returns nothing for an absent matrix", () => {
    expect(devicesInMatrix(undefined)).toEqual([]);
  });
});

describe("errorMessage", () => {
  it("reads the message off an Error", () => {
    expect(errorMessage(new Error("503 Service Unavailable"))).toBe("503 Service Unavailable");
  });

  it.each([
    ["a string", "boom", "boom"],
    ["a plain object", { code: 42 }, "[object Object]"],
    ["undefined", undefined, "undefined"],
  ])("stringifies %s", (_label, thrown, expected) => {
    expect(errorMessage(thrown)).toBe(expected);
  });
});

describe("isUsableMatrix", () => {
  const cached = (overrides: Partial<Matrix> = {}): Matrix => ({
    collectedAt: "2026-09-11T07:00:00.000Z",
    columns: { nanosp: [{ key: "nanosp/P1/current" }] as Matrix["columns"][string] },
    apps: [{ name: "Concordium", repo: null, versions: {} }],
    warnings: [],
    ...overrides,
  });

  it("accepts a matrix with apps and at least one populated device", () => {
    expect(isUsableMatrix(cached())).toBe(true);
  });

  it.each([null, undefined])("rejects %s", value => {
    expect(isUsableMatrix(value as Matrix | null)).toBe(false);
  });

  it("rejects a matrix with no apps", () => {
    expect(isUsableMatrix(cached({ apps: [] }))).toBe(false);
  });

  it("rejects a matrix with no devices", () => {
    expect(isUsableMatrix(cached({ columns: {} }))).toBe(false);
  });

  // An empty array is truthy, so this is the case a plain truthiness check lets through.
  it("rejects a device whose column list is empty", () => {
    expect(isUsableMatrix(cached({ columns: { nanosp: [] } }))).toBe(false);
  });

  it("rejects a device whose column list is not an array", () => {
    const corrupt = { nanosp: 5 } as unknown as Matrix["columns"];
    expect(isUsableMatrix(cached({ columns: corrupt }))).toBe(false);
  });
});

describe("incompleteCollectionNotice", () => {
  const matrix = (warnings: string[]): Matrix => ({
    collectedAt: "2026-09-11T07:00:00.000Z",
    columns: { nanosp: [] },
    apps: [],
    warnings,
  });

  // Regression: readCache hydrates a partial matrix and the mount effect skips fetching,
  // so a notice written only while collecting would never appear.
  it("reports the warnings a cached partial collection carries", () => {
    expect(
      incompleteCollectionNotice(matrix(["nanosp/P4/next: firmware 1.7.0-rc2 failed"])),
    ).toEqual({
      appearance: "warning",
      title: "Collection was incomplete — some slots are missing.",
      details: ["nanosp/P4/next: firmware 1.7.0-rc2 failed"],
    });
  });

  it("reports nothing for a complete collection", () => {
    expect(incompleteCollectionNotice(matrix([]))).toBeNull();
  });

  it("reports nothing before any matrix is loaded", () => {
    expect(incompleteCollectionNotice(null)).toBeNull();
  });
});

describe("device selection in the URL", () => {
  const set = (...keys: string[]) => new Set(keys);

  it("reads the default selection when the parameter is absent", () => {
    expect(parseDeviceSelection(null)).toEqual(set("nanosp"));
  });

  it("writes no parameter for the default selection, so a plain link stays plain", () => {
    expect(serialiseDeviceSelection(set("nanosp"))).toBeNull();
  });

  it("round-trips an explicit selection", () => {
    const value = serialiseDeviceSelection(set("stax", "flex"));
    expect(value).toBe("stax,flex");
    expect(parseDeviceSelection(value)).toEqual(set("stax", "flex"));
  });

  it("writes DEVICES order regardless of the order boxes were ticked", () => {
    expect(serialiseDeviceSelection(set("apex", "nanosp", "stax"))).toBe("nanosp,stax,apex");
  });

  it("spells the empty selection so it is not read back as the default", () => {
    expect(serialiseDeviceSelection(set())).toBe("none");
    expect(parseDeviceSelection("none")).toEqual(set());
  });

  it("ignores keys that name no configured device", () => {
    expect(parseDeviceSelection("stax,blue,,nanosp")).toEqual(set("nanosp", "stax"));
  });
});

describe("matchesFilter", () => {
  const app = { name: "Concordium", repo: "LedgerHQ/app-concordium", versions: {} };

  it.each(["concord", "ledgerhq/app"])("matches on %s", needle => {
    expect(matchesFilter(app, needle)).toBe(true);
  });

  it("does not match an unrelated needle", () => {
    expect(matchesFilter(app, "tezos")).toBe(false);
  });

  it("tolerates an app with no repository", () => {
    expect(matchesFilter({ ...app, repo: null }, "concord")).toBe(true);
  });
});
