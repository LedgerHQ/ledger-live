export class Device {
  constructor(
    public readonly name: string,
    public readonly targetId: number,
  ) {}

  static readonly LNS = new Device("nanoS", 823132164);
  static readonly LNX = new Device("nanoX", 855638020);
  static readonly LNSP = new Device("nanoSP", 856686596);
}
