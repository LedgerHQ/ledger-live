import network from "../network";
import { getEnv } from "../env";
import type { State } from "../apps/types";
import { getActionPlan } from "../apps/logic";
import { version as liveCommonVersion } from "../../package.json";

const getBaseApiUrl = () => getEnv("API_BIM");

/**
 * Big bald disclaimer about all this. The token is currently a base64
 * representation of the queue, nothing else, but eventually we will have
 * a smarter and encoded token blackbox. I mention this in case someone
 * is reading and wondering why on earth are we doing this.
 */
type Item = {
  operation: "install" | "uninstall";
  id: number;
  targetId: string | number;
  liveCommonVersion?: string;
};
type Queue = Array<Item>;

function buildQueueFromState(state: State): Array<Item> {
  const actionPlan = getActionPlan(state);
  const { targetId } = state.deviceInfo;
  const queue: Array<Item> = actionPlan.map(({ name, type }) => ({
    id: state.appByName[name].id,
    operation: type,
    targetId,
    liveCommonVersion,
  }));

  return queue;
}

async function getTokenFromQueue(queue: Queue): Promise<string> {
  const { data } = await network({
    method: "PUT",
    url: `${getBaseApiUrl()}/queue`,
    data: { tasks: queue },
  });

  return data;
}

async function getQueueFromToken(token: string): Promise<Queue> {
  const { data } = await network({
    method: "GET",
    url: `${getBaseApiUrl()}/unpacked-queue`,
    headers: {
      "X-Bim-Token": token,
    },
  });
  return data;
}

const API = {
  getTokenFromQueue,
  getQueueFromToken,
  buildQueueFromState,
};

export default API;
