export const remote: jest.Mocked<{ dialog: object }> = {
  dialog: {
    showOpenDialog: jest.fn().mockReturnValue("path/to/output"),
  },
};

export const shell: jest.Mocked<{ openExternal: () => unknown }> = {
  openExternal: jest.fn(),
};

export const app: jest.Mocked<{ getPath: () => unknown }> = {
  getPath: jest.fn().mockReturnValue("path/to/output"),
};

export const ipcRenderer: jest.Mocked<{
  on: () => unknown;
  send: () => unknown;
  invoke: (channel: string) => Promise<unknown>;
}> = {
  on: jest.fn(),
  send: jest.fn(),
  // Return a resolved Promise so load-time code (e.g. sentry/anonymizer) that does invoke(...).then(...) does not throw
  invoke: jest.fn().mockResolvedValue(""),
};

const electron: jest.Mocked<{
  remote: typeof remote;
  shell: { openExternal: () => unknown };
  ipcRenderer: typeof ipcRenderer;
}> = {
  remote,
  shell,
  ipcRenderer,
};

export default electron;
