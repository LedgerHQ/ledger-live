import { useCallback, useState } from "react";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import useEnv from "@features/platform-env";
import { swapMockServerDevice } from "~/renderer/mockServerTransport";
import {
  defaultMockServerDeviceSelection,
  MOCK_SERVER_DEVICE_MODELS,
  MOCK_SERVER_DEVICE_MODEL_IDS,
  readMockServerDevice,
  type MockServerDeviceSelection,
} from "~/renderer/mockServerDevice";

export type MockServerDeviceSettingsViewModel = {
  visible: boolean;
  model: DeviceModelId;
  onboarded: boolean;
  osVersion: string;
  osVersionDraft: string;
  osVersionApplied: boolean;
  modelOptions: { value: DeviceModelId; label: string }[];
  pending: boolean;
  failed: boolean;
  onModelChange: (model: DeviceModelId) => void;
  onOnboardedChange: (onboarded: boolean) => void;
  onOsVersionDraftChange: (osVersion: string) => void;
  onOsVersionApply: () => void;
};

const MODEL_OPTIONS = MOCK_SERVER_DEVICE_MODEL_IDS.map(id => ({
  value: id,
  label: MOCK_SERVER_DEVICE_MODELS[id].label,
}));

export const useMockServerDeviceSettingsViewModel = (): MockServerDeviceSettingsViewModel => {
  const visible = useEnv("MOCK_SERVER_TRANSPORT");
  const [selection, setSelection] = useState<MockServerDeviceSelection>(
    () => readMockServerDevice() ?? defaultMockServerDeviceSelection(),
  );
  const [osVersionDraft, setOsVersionDraft] = useState(selection.osVersion);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const swap = useCallback(async (next: MockServerDeviceSelection) => {
    // The swap takes several round trips with the controls disabled, so they
    // have to already show what is being applied.
    setSelection(next);
    setOsVersionDraft(next.osVersion);
    setPending(true);
    setFailed(false);
    try {
      await swapMockServerDevice(next);
    } catch (error) {
      console.warn("Failed to swap the mock server device", error);
      setFailed(true);
    } finally {
      setPending(false);
    }
  }, []);

  const onModelChange = useCallback(
    (model: DeviceModelId) => {
      if (model === selection.model) return;
      // An OS version only exists in one model's catalogue, so the new model
      // starts from its own default rather than inheriting the previous one.
      void swap({ ...defaultMockServerDeviceSelection(model), onboarded: selection.onboarded });
    },
    [selection.model, selection.onboarded, swap],
  );

  const onOnboardedChange = useCallback(
    (onboarded: boolean) => {
      void swap({ ...selection, onboarded });
    },
    [selection, swap],
  );

  const onOsVersionApply = useCallback(() => {
    const osVersion = osVersionDraft.trim();
    if (!osVersion || osVersion === selection.osVersion) return;
    void swap({ ...selection, osVersion });
  }, [osVersionDraft, selection, swap]);

  return {
    visible,
    model: selection.model,
    onboarded: selection.onboarded,
    osVersion: selection.osVersion,
    osVersionDraft,
    osVersionApplied: osVersionDraft.trim() === selection.osVersion,
    modelOptions: MODEL_OPTIONS,
    pending,
    failed,
    onModelChange,
    onOnboardedChange,
    onOsVersionDraftChange: setOsVersionDraft,
    onOsVersionApply,
  };
};
