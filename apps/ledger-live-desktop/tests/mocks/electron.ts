export const remote = {
  dialog: {
    showOpenDialog: jest.fn().mockReturnValue("path/to/output"),
  },
};

export const shell = {
  openExternal: jest.fn(),
};

export const app = {
  getPath: jest.fn().mockReturnValue("path/to/output"),
};

export default { remote, shell };
