import { createFakePort } from "@features/flow-settings/testing";
import type {
  GeneralSettingsData,
  GeneralSettingsPort,
  GeneralSettingsValues,
  GeneralSettingUpdate,
  RegionSettingsValues,
  RegionUpdate,
  DateFormatSettingsValues,
  DateFormatUpdate,
} from "../ports";

type FakeValues = GeneralSettingsValues & RegionSettingsValues & DateFormatSettingsValues;

const DEFAULT_VALUES: FakeValues = {
  theme: "system",
  language: "en",
  currency: "USD",
  region: "en-US",
  dateFormat: "default",
};

type FakeData = Partial<Omit<GeneralSettingsData, "ledgerSync">> &
  Readonly<{ isLedgerSyncActive?: boolean }>;

/**
 * A port for tests: values change with each update (recorded in `updates`), and each Ledger Sync
 * opening is counted in `ledgerSyncOpenings`.
 */
export function createFakeGeneralPort(initial?: Partial<FakeValues>, data?: FakeData) {
  const { port: valuesPort, updates } = createFakePort<
    FakeValues,
    GeneralSettingUpdate | RegionUpdate | DateFormatUpdate
  >(DEFAULT_VALUES, initial);
  const ledgerSyncOpenings = { count: 0 };

  const port: GeneralSettingsPort = {
    get values() {
      return valuesPort.values;
    },
    setValue: valuesPort.setValue,
    languages: data?.languages ?? [
      { value: "en", label: "English" },
      { value: "fr", label: "Français" },
    ],
    currencies: data?.currencies ?? [
      { value: "EUR", label: "Euro - EUR" },
      { value: "USD", label: "US Dollar - USD" },
    ],
    ledgerSync: {
      isActive: data?.isLedgerSyncActive ?? false,
      open: () => {
        ledgerSyncOpenings.count += 1;
      },
    },
  };

  return { port, updates, ledgerSyncOpenings };
}
