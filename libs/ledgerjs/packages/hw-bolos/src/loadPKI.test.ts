import { createTransportRecorder, MockTransport, RecordStore } from "@ledgerhq/hw-transport-mocker";
import loadPKI from "./loadPKI";

describe("loadPKI", () => {
  const recordStore = new RecordStore();
  const mockTransport = new MockTransport(Buffer.from([0, 0x90, 0x00]));
  const TransportRecorder = createTransportRecorder(mockTransport, recordStore);

  it("returns a new Challenge value", async () => {
    // Given
    const descriptor = "010203";
    const signature = "0a0b0c0d0e0f1a1b1c1d1e1f";
    const signatureLengthInHex = "0c";
    const transport = new TransportRecorder(mockTransport);

    // When
    await loadPKI(transport, "GENUINE_CHECK", descriptor, signature);

    // Then
    const expectCommand = Buffer.from([0xb0, 0x06, 0x01, 0x00]).toString("hex");
    const certSeparator = "15";
    const data = descriptor + certSeparator + signatureLengthInHex + signature;
    const dataLengthInHex = (data.length / 2).toString(16);
    expect(recordStore.queue[0][0]).toBe(expectCommand + dataLengthInHex + data);
  });
});
