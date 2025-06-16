import { type Device, getCertificate } from "./certificate";

describe("getCertificate", () => {
  it.each([
    {
      device: "nanoS",
      version: "2.1.0",
      descriptor:
        "01010102010235010136010110040201000013020002140101200c747275737465645f6e616d65300200073101043201213401013321036a94e7a42cd0c33fdf440c8e2ab2542cefbe5db7aa0b93a9fc814b9acfa75eb4",
      signature:
        "3045022100a58f50032b52d0879e8784ce3fc22d92dfab3ad3d088b7db4021b9e3b7f5494c022043c8a5cbb64548852e8561828196a7c744325acf3b74c00f95f7e2633ffc21a5",
    },
    {
      device: "nanoSP",
      version: "1.3.0",
      descriptor:
        "01010102010235010336010110040103000013020002140101200c747275737465645f6e616d65300200073101043201213401013321036a94e7a42cd0c33fdf440c8e2ab2542cefbe5db7aa0b93a9fc814b9acfa75eb4",
      signature:
        "3045022100906158a037e0bd4e9f6b28972d3bfa00d2444e03693831f81652782f7393c471022071b44c3627c7f3cff8a4ed5ad858fc9580c63a9281b6f4027d5a17e7d1a26baa",
    },
    {
      device: "nanoX",
      version: "2.4.0",
      descriptor:
        "01010102010235010236010110040204000013020002140101200c747275737465645f6e616d65300200073101043201213401013321036a94e7a42cd0c33fdf440c8e2ab2542cefbe5db7aa0b93a9fc814b9acfa75eb4",
      signature:
        "3045022100c274501e7b9e038959e47ddd9d62131df434b66cf697a57d1d5552045658a1da02201d3b0ab510e7be66cd09af1b0e7fdf22febbeb0a6f11d36b8c0936a17f220f36",
    },
    {
      device: "stax",
      version: "1.6.0",
      descriptor:
        "01010102010235010436010110040106000013020002140101200c747275737465645f6e616d65300200073101043201213401013321036a94e7a42cd0c33fdf440c8e2ab2542cefbe5db7aa0b93a9fc814b9acfa75eb4",
      signature:
        "304402204a3685ccda754de34570d7b07a4d80d38edb494404a48d82a7105a24f2c9ec2c02204d9fcb52e0b59951232a2858f38eb7609854ca3bdc42da76e1d100af50dcfb45",
    },
    {
      device: "flex",
      version: "2.1.0",
      descriptor:
        "01010102010235010536010110040201000013020002140101200c747275737465645f6e616d65300200073101043201213401013321036a94e7a42cd0c33fdf440c8e2ab2542cefbe5db7aa0b93a9fc814b9acfa75eb4",
      signature:
        "304402201b594f02f04a658345e9fd74330c170a03a7f2775abd3b4d4bc13a9ea363a30d0220441016e4d3d1f33d32f1c71811d7a6dbaa8318554b5054fb2feaac9976c48744",
    },
  ] satisfies { device: Device; version: string; descriptor: string; signature: string }[])(
    "returns descriptor and signature with the given version for $device",
    async ({ device, version, descriptor, signature }) => {
      // When
      const result = await getCertificate(device, version, { env: "test", signatureKind: "test" });

      // Then
      expect(result).toEqual({
        descriptor,
        signature,
      });
    },
  );

  it.each([
    {
      device: "nanoS",
      descriptor:
        "01010102010235010136010110040201000013020002140101200c747275737465645f6e616d65300200073101043201213401013321036a94e7a42cd0c33fdf440c8e2ab2542cefbe5db7aa0b93a9fc814b9acfa75eb4",
      signature:
        "3045022100a58f50032b52d0879e8784ce3fc22d92dfab3ad3d088b7db4021b9e3b7f5494c022043c8a5cbb64548852e8561828196a7c744325acf3b74c00f95f7e2633ffc21a5",
    },
    {
      device: "nanoSP",
      descriptor:
        "01010102010235010336010110040103000013020002140101200c747275737465645f6e616d65300200073101043201213401013321036a94e7a42cd0c33fdf440c8e2ab2542cefbe5db7aa0b93a9fc814b9acfa75eb4",
      signature:
        "3045022100906158a037e0bd4e9f6b28972d3bfa00d2444e03693831f81652782f7393c471022071b44c3627c7f3cff8a4ed5ad858fc9580c63a9281b6f4027d5a17e7d1a26baa",
    },
    {
      device: "nanoX",
      descriptor:
        "01010102010235010236010110040204000013020002140101200c747275737465645f6e616d65300200073101043201213401013321036a94e7a42cd0c33fdf440c8e2ab2542cefbe5db7aa0b93a9fc814b9acfa75eb4",
      signature:
        "3045022100c274501e7b9e038959e47ddd9d62131df434b66cf697a57d1d5552045658a1da02201d3b0ab510e7be66cd09af1b0e7fdf22febbeb0a6f11d36b8c0936a17f220f36",
    },
    {
      device: "stax",
      descriptor:
        "01010102010235010436010110040106000013020002140101200c747275737465645f6e616d65300200073101043201213401013321036a94e7a42cd0c33fdf440c8e2ab2542cefbe5db7aa0b93a9fc814b9acfa75eb4",
      signature:
        "304402204a3685ccda754de34570d7b07a4d80d38edb494404a48d82a7105a24f2c9ec2c02204d9fcb52e0b59951232a2858f38eb7609854ca3bdc42da76e1d100af50dcfb45",
    },
    {
      device: "flex",
      descriptor:
        "01010102010235010536010110040201000013020002140101200c747275737465645f6e616d65300200073101043201213401013321036a94e7a42cd0c33fdf440c8e2ab2542cefbe5db7aa0b93a9fc814b9acfa75eb4",
      signature:
        "304402201b594f02f04a658345e9fd74330c170a03a7f2775abd3b4d4bc13a9ea363a30d0220441016e4d3d1f33d32f1c71811d7a6dbaa8318554b5054fb2feaac9976c48744",
    },
  ] satisfies { device: Device; descriptor: string; signature: string }[])(
    "returns the latest data in expected format for $device",
    async ({ device, descriptor, signature }) => {
      // When
      const result = await getCertificate(device, "latest", { env: "test", signatureKind: "test" });

      // Then
      expect(result).toEqual({
        descriptor,
        signature,
      });
    },
  );
});
