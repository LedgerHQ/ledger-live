export type SignerFactory<T> = (deviceId: string) => Promise<T>;
