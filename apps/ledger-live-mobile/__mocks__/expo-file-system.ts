// expo-file-system needs a native runtime, and pnpm installs one copy per peer-dependency set:
// the app and the workspace packages it renders resolve different physical modules, so a
// jest.mock only ever covered the caller's copy. moduleNameMapper points every copy here.
function uriOf(part: string | { uri: string }): string {
  return typeof part === "string" ? part : part.uri;
}

export class Directory {
  uri: string;

  constructor(...uris: Array<string | Directory>) {
    this.uri = uris.map(uriOf).join("/");
  }
}

export class File {
  uri: string;
  exists = false;

  constructor(...uris: Array<string | Directory | File>) {
    this.uri = uris.map(uriOf).join("/");
  }

  create(): void {}
  write(): void {}
  delete(): void {}
  base64(): Promise<string> {
    return Promise.resolve("");
  }
  base64Sync(): string {
    return "";
  }
}

export const Paths = {
  document: new Directory("file:///mock/document"),
  cache: new Directory("file:///mock/cache"),
};
