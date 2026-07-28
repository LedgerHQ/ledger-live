import { killYaci } from "./yaci";

export default async function globalTeardown(): Promise<void> {
  await killYaci();
}
