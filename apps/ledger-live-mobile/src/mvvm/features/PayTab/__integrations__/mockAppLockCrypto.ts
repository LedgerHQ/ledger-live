jest.mock("LLM/features/AppLock/adapters/passwordDigest", () => ({
  APP_LOCK_SALT_LENGTH: 16,
  APP_LOCK_SCRYPT_PARAMS: { cost: 16384, blockSize: 8, parallelization: 1, digestLength: 32 },
  derivePasswordDigest: jest.fn(async () => Uint8Array.from([10, 20, 30, 40])),
  serialiseDerivation: <T>(run: () => Promise<T>) => run(),
}));
