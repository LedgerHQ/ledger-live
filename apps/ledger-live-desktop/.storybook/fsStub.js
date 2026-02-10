const notAvailable = () => new Error("fs is not available in Storybook preview");

const fsStub = {
  existsSync: () => false,
  readFile: (_path, cb) => {
    if (typeof cb === "function") {
      cb(notAvailable());
    }
  },
  writeFile: (_path, _data, _encoding, cb) => {
    if (typeof _encoding === "function") {
      _encoding(notAvailable());
      return;
    }
    if (typeof cb === "function") {
      cb(notAvailable());
    }
  },
  promises: {
    readFile: async () => {
      throw notAvailable();
    },
    writeFile: async () => {
      throw notAvailable();
    },
  },
};

module.exports = fsStub;
