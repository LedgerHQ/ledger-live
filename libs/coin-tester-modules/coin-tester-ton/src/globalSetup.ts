import { spawnLocalTon } from "./localTon";

export default async function globalSetup(): Promise<void> {
  await spawnLocalTon();
}
