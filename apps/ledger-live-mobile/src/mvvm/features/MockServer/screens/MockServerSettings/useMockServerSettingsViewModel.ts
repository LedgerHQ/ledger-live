import { getEnv } from "@shared/env";
import type { MockServerSettingsFormProps } from "@features/flow-device-mock-server";
import { useSelector } from "~/context/hooks";
import { mockServerSettingsSelector } from "~/reducers/settings";
import { useApplyMockServerChange } from "../../hooks/useApplyMockServerChange";

export function useMockServerSettingsViewModel(): MockServerSettingsFormProps {
  const settings = useSelector(mockServerSettingsSelector);
  const onApply = useApplyMockServerChange();

  return {
    settings,
    defaultUrl: getEnv("MOCK_SERVER_TRANSPORT_URL"),
    sessionImport: getEnv("MOCK_SERVER_SESSION"),
    seed: getEnv("MOCK_SERVER_SEED").trim() || undefined,
    onApply,
  };
}
