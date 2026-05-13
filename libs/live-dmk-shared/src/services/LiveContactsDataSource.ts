import { type ContactsDataSource } from "@ledgerhq/context-module";

export class LiveContactsDataSource {
  private static _instance: LiveContactsDataSource | null = null;

  private inner: ContactsDataSource | null = null;

  private constructor() {}

  static getInstance(): LiveContactsDataSource {
    if (!LiveContactsDataSource._instance) {
      LiveContactsDataSource._instance = new LiveContactsDataSource();
    }
    return LiveContactsDataSource._instance;
  }

  setInner(inner: ContactsDataSource | null) {
    this.inner = inner;
  }

  getInner(): ContactsDataSource | null {
    return this.inner;
  }
}

export const liveContactsDataSource = LiveContactsDataSource.getInstance();
