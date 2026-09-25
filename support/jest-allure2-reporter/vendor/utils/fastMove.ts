import path from 'node:path';
import fs from 'node:fs/promises';

export async function fastMove(source: string, destination: string) {
  await fs.mkdir(path.dirname(destination), { recursive: true });

  try {
    await fs.rename(source, destination);
  } catch {
    await fs.copyFile(source, destination);
    await fs.rm(source, { force: true });
  }
}
