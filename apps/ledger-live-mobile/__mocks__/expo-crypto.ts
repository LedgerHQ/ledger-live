// expo-crypto needs a native runtime, and pnpm installs one copy per peer-dependency set:
// the app and the workspace packages it renders (e.g. @features/flow-pay-card-auth) resolve
// different physical modules, so a jest.mock only ever covered the caller's copy.
// moduleNameMapper points every copy here.
export const CryptoDigestAlgorithm = { SHA256: "SHA-256" };
export const CryptoEncoding = { BASE64: "base64" };
export const getRandomBytesAsync = jest.fn(() => Promise.resolve(new Uint8Array(32)));
export const digestStringAsync = jest.fn(() => Promise.resolve("Y29kZS1jaGFsbGVuZ2U="));
