import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import archiver from 'archiver';

// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntimePluginContext, FileAttachmentHandler } from '@support/jest-allure2-reporter/api';

export function createZipHandler(pluginContext: AllureRuntimePluginContext): FileAttachmentHandler {
  return async function zipHandler(context) {
    return pluginContext.fileAttachmentHandlers.move({
      ...context,
      sourcePath: await packDirectory(context.sourcePath),
      name: context.name.endsWith('.zip') ? context.name : `${context.name}.zip`,
      mimeType: 'application/zip',
    });
  };
}

async function packDirectory(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const seed = crypto.randomBytes(8).toString('hex');
    const dest = path.join(os.tmpdir(), `detox-allure2-zipped-${seed}.zip`);
    const output = fs.createWriteStream(dest);
    output.on('close', () => resolve(dest));
    output.on('end', () => resolve(dest));

    const archive = archiver('zip');
    archive.directory(src, path.basename(src));
    archive.pipe(output);
    archive.on('error', reject);
    archive.finalize();
  });
}
