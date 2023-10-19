import { version } from "../../../../package.json";
import { getEnv } from "@ledgerhq/live-env";
import fetchMcus from "../../../device-core/use-cases/managerApi/fetchMcus";

export default function fetchMcusUseCase() {
  return fetchMcus({managerApiBase: getEnv("MANAGER_API_BASE"), liveCommonVersion: version});
};
