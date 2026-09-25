import fs from 'node:fs/promises';
import path from 'node:path';
import { OnErrorHandlerFn } from '../types';

export class RecycleBin {
  private static _instance: RecycleBin | undefined;
  private readonly _files = new Set<string>();
  private constructor(private readonly _onError: OnErrorHandlerFn) {}

  static instance(onError?: OnErrorHandlerFn) {
    if (onError) {
      this._instance = new RecycleBin(onError);
    }

    if (!this._instance) {
      throw new Error('[detox-allure2-adapter] RecycleBin instance not initialized');
    }

    return this._instance;
  }

  add = async (filePath: string) => {
    this._files.add(path.resolve(filePath));
  };

  delete = async (filePath: string) => {
    try {
      await fs.rm(path.resolve(filePath), { recursive: true, force: true });
      this._files.delete(path.resolve(filePath));
    } catch (error) {
      return this._onError(error as Error);
    }
  };

  clear = async () => {
    await Promise.all([...this._files].map(this.delete));
    this._files.clear();
  };
}
