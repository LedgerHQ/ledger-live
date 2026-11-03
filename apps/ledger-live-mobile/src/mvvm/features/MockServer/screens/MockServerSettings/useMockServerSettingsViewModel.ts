import { getEnv } from "@shared/env";
import type { MockServerSettingsFormProps } from "@features/flow-device-mock-server";
import { useSelector } from "~/context/hooks";
import { mockServerSettingsSelector } from "~/reducers/settings";
import { useMockServerHost } from "../../hooks/useMockServerHost";

export function useMockServerSettingsViewModel(): MockServerSettingsFormProps {
  const settings = useSelector(mockServerSettingsSelector);
  const host = useMockServerHost();

  return { settings, defaultUrl: getEnv("MOCK_SERVER_TRANSPORT_URL"), host };
}
