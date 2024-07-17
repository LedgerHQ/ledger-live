export const remote: jest.Mocked<{ dialog: {} }> = {
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
  invoke: () => unknown;
}> = {
  on: jest.fn(),
  send: jest.fn(),
  invoke: jest.fn(),
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
