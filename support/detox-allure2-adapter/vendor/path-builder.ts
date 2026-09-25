import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export default class DetoxAllurePathBuilder {
  #temporaryDirectory: string;

  constructor() {
    this.#temporaryDirectory = fs.mkdtempSync(os.tmpdir() + path.sep + 'detox-artifacts-');
  }

  /** @returns {string} */
  buildPathForTestArtifact(artifactName: string) {
    return path.join(
      this.#temporaryDirectory,
      crypto.randomBytes(16).toString('hex'),
      artifactName,
    );
  }
}
