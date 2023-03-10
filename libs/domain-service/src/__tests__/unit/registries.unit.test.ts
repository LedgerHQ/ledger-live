import {
  getRegistriesForAddress,
  getRegistriesForDomain,
} from "../../registries";

describe("Domain Service", () => {
  describe("Registries", () => {
    describe("getRegistriesForDomain", () => {
      it("should return a registry for a supported domain (ENS)", async () => {
        expect(await getRegistriesForDomain("vitalik.eth")).toHaveLength(1);
      });

      it("should return an empty array for an unsupported domain", async () => {
        expect(await getRegistriesForDomain("vitalik.notsupport")).toHaveLength(
          0
        );
      });
    });

    describe("getRegistriesForAddress", () => {
      it("should return a registry for a supported domain (ENS)", async () => {
        expect(
          await getRegistriesForAddress(
            "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
          )
        ).toHaveLength(1);
      });

      it("should return an empty array for an unsupported domain", async () => {
        expect(await getRegistriesForAddress("0x123")).toHaveLength(0);
      });
    });
  });
});
