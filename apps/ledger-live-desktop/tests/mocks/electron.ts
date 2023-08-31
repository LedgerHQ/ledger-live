import { jest } from "@jest/globals";

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

const electron: jest.Mocked<{ remote: typeof remote; shell: { openExternal: () => unknown } }> = {
  remote,
  shell,
};

export default electron;
