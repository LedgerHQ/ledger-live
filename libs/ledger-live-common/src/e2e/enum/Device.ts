export class Device {
  constructor(
    public readonly name: string,
    public readonly targetId: number,
  ) {}

  static readonly LNS = new Device("nanoS", 823132164);
  static readonly LNX = new Device("nanoX", 855638020);
  static readonly LNSP = new Device("nanoSP", 856686596);
  static readonly STAX = new Device("stax", 857735172);
  static readonly FLEX = new Device("flex", 858783748);
  static readonly NANO_GEN_5 = new Device("nanoGen5", 859832324);
}
