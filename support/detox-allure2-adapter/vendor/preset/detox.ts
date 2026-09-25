const config: Partial<Detox.DetoxConfig> = {
  artifacts: {
    rootDir: 'artifacts/',
    plugins: {
      log: 'all',
      screenshot: 'manual',
      video: 'none',
      instruments: 'none',
      uiHierarchy: 'enabled',
    },
  },
};

export default config as object;
