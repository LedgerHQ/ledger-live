// This signature is required as this because of the way LLC withDevice is designed;
// The transport is passed to the method provided and then closed.
// So we can't keep an instance depending on the transport, as it will usefull outside of the `job`.
export type PassthroughFn<T, U> = (signer: T) => Promise<U>;
export type SignerContext<T, U> = (deviceId: string, fn: PassthroughFn<T, U>) => Promise<U>;
