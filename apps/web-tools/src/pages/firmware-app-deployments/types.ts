export type DeviceSpec = {
  /** `device_versions[].id` in the Manager API. */
  id: number;
  key: string;
  label: string;
};

export type ProviderSpec = {
  id: number;
  label: string;
};

export type DeviceVersion = {
  id: number;
  target_id: number;
  providers: number[];
};

export type FinalFirmwareVersion = {
  name: string;
  device_versions: number[];
  providers: number[];
};

export type CatalogEntry = {
  versionName: string;
  versionDisplayName?: string;
  version: string;
  sourceURL?: string;
  dateModified?: string;
};

/** One device × provider × firmware track worth fetching a catalog for. */
export type Slot = {
  key: string;
  device: DeviceSpec;
  provider: ProviderSpec;
  targetId: number;
  track: "current" | "next";
  candidates: FinalFirmwareVersion[];
  /** Nothing built for this track yet is a real answer, not a failure. */
  mayBeEmpty: boolean;
};

/** A rendered column: one provider's catalog on one firmware track of one device. */
export type MatrixColumn = {
  key: string;
  deviceKey: string;
  provider: string;
  track: "current" | "next";
  firmware: string;
};

export type MatrixApp = {
  name: string;
  repo: string | null;
  /** Keyed by `MatrixColumn.key`. */
  versions: Record<string, { version: string; modified: string }>;
};

/** The banner shown above the table. */
export type Notice = { appearance: "warning" | "error"; title: string; details?: string[] };

/** A device as the page presents it, resolved from DEVICES rather than from the data. */
export type ShownDevice = { key: string; label: string };

export type Matrix = {
  collectedAt: string;
  /**
   * Keyed by device key. The order the devices appear in is not stored — it comes from
   * DEVICES at render time, so the one constant governs both the controls and the table.
   */
  columns: Record<string, MatrixColumn[]>;
  apps: MatrixApp[];
  warnings: string[];
};
