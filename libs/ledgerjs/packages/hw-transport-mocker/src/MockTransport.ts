import Transport from "@ledgerhq/hw-transport";

export default class MockTransport extends Transport {
  private preRecordResponse: Buffer;

  constructor(preRecordResponse: Buffer) {
    super();
    this.preRecordResponse = preRecordResponse;
  }

  exchange(_apdu: Buffer): Promise<Buffer> {
    return Promise.resolve(this.preRecordResponse);
  }
}
