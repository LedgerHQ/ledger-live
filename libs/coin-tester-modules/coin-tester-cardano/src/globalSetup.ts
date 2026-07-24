import { spawnYaci } from "./yaci";

export default async function globalSetup(): Promise<void> {
  await spawnYaci();
}
