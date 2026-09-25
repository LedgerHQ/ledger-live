// eslint-disable-next-line import/no-internal-modules
import type { AndroidEntry, Entry, IosEntry } from 'logkitten';
import { Level } from 'logkitten';

export class PIDEntryCollection {
  private _entries: Entry[] = [];
  private _purgatory: Entry[] = [];
  private _pid: number = Number.NaN;
  private _current: Entry[] = this._purgatory;

  get pid(): number {
    return this._pid;
  }

  set pid(value: number) {
    this._pid = value;
    this._current = Number.isFinite(this._pid) ? this._entries : this._purgatory;

    if (this._purgatory.length > 0) {
      const queue = this._purgatory.splice(0);
      if (this._current === this._entries) {
        this._entries.push(...queue);
      }
    }
  }

  public static format(entry: Entry): string {
    const level = Level[entry.level as Level] || 'UNKNOWN';
    const tagOrCategory =
      (entry as AndroidEntry).tag ||
      join2((entry as IosEntry).subsystem, (entry as IosEntry).category);
    const msg = entry.msg.replace(/\n/g, '\n\t\t');

    return `${level}\t${tagOrCategory}\t${msg}`;
  }

  public push(entry: Entry): void {
    this._current.push(entry);
  }

  public flushAsString(): string {
    const entries = this._flush();
    if (entries.length === 0) {
      return '';
    }

    const result = entries.map(PIDEntryCollection.format).reduce((acc, entry, index, array) => {
      if (index === 0) {
        return entry;
      }

      if (entry === array[index - 1]) {
        return acc;
      }

      return acc + '\n' + entry;
    }, '');

    return result + '\n';
  }

  private _flush() {
    return this._entries.splice(0) as (AndroidEntry & IosEntry)[];
  }
}

function join2(a: string, b: string): string {
  return a && b ? `${a}:${b}` : a || b || '';
}
