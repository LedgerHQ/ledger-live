export const remote: jest.Mocked<{ dialog: object }> = {
  dialog: {
    showOpenDialog: jest.fn().mockReturnValue("path/to/output"),
  },
};

export const shell: jest.Mocked<{ openExternal: () => unknown }> = {
  openExternal: jest.fn(),
};

let clipboardText = "";

export const clipboard: jest.Mocked<{
  writeText: (text: string) => void;
  readText: () => string;
}> = {
  writeText: jest.fn((text: string) => {
    clipboardText = text;
  }),
  readText: jest.fn(() => clipboardText),
};

export const app: jest.Mocked<{ getPath: () => unknown }> = {
  getPath: jest.fn().mockReturnValue("path/to/output"),
};

export const ipcRenderer: jest.Mocked<{
  on: () => unknown;
  send: () => unknown;
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
}> = {
  on: jest.fn(),
  send: jest.fn(),
  invoke: jest.fn().mockResolvedValue(""),
};

const electron: jest.Mocked<{
  remote: typeof remote;
  shell: { openExternal: () => unknown };
  clipboard: typeof clipboard;
  ipcRenderer: typeof ipcRenderer;
}> = {
  remote,
  shell,
  clipboard,
  ipcRenderer,
};

export default electron;
