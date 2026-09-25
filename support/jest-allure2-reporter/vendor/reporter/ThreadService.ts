const FREE_SLOT = undefined;

export class ThreadService {
  private readonly _activeThreads: (string | undefined)[] = [];

  allocateThread(testPath: string): number {
    let freeIndex = this._activeThreads.indexOf(FREE_SLOT);
    if (freeIndex === -1) {
      freeIndex = this._activeThreads.push(testPath);
    } else {
      this._activeThreads[freeIndex] = testPath;
    }

    return freeIndex;
  }

  freeThread(testPath: string): void {
    const testFileIndex = this._activeThreads.indexOf(testPath);
    if (testFileIndex !== -1) {
      this._activeThreads[testFileIndex] = FREE_SLOT;
    }
  }
}
