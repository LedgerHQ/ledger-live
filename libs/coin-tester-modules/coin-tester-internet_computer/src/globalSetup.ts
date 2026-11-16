import { spawnLocalIcp } from "./localIcp";

export default async function globalSetup(): Promise<void> {
  await spawnLocalIcp();
}
