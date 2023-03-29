import axios from "axios";
import { AssertionError } from "assert";
import { signAddressResolution, signDomainResolution } from "../../signers";

jest.mock("axios");
const mockedAxios = jest.mocked(axios);

describe("Domain Service", () => {
  describe("Signers", () => {
    describe("signDomainResolution", () => {
      beforeEach(() => {
        jest.restoreAllMocks();
        jest
          .spyOn(mockedAxios, "request")
          .mockImplementation(async ({ url }) => {
            const regex = /.*ens.*forward.*vitalik.eth/;
            if (url && regex.test(url)) {
              return {
                data: {
                  payload:
                    "010103020101130103140101120021013c200b766974616c696b2e6574682214d8da6bf26964af9d7eed9e03e53415d37aa9604515473045022100eb0b71c3bc69990eb98a4518473f49821554b1fd3e29f9994246902edbab2e3f02204c1480d8d1d1ef5e7e545d31a95484a84da4a1827e4288d0efa888c664faf03d",
                },
              } as any;
            }
            return Promise.reject({ response: { status: 404 } }) as any;
          });
      });

      it("should return the APDU for an ENS resolution", async () => {
        expect(await signDomainResolution("vitalik.eth", "ens", "123")).toEqual(
          "010103020101130103140101120021013c200b766974616c696b2e6574682214d8da6bf26964af9d7eed9e03e53415d37aa9604515473045022100eb0b71c3bc69990eb98a4518473f49821554b1fd3e29f9994246902edbab2e3f02204c1480d8d1d1ef5e7e545d31a95484a84da4a1827e4288d0efa888c664faf03d"
        );
      });

      it("should return null for an unknown registry", async () => {
        expect(
          await signDomainResolution("vitalik.eth", "test" as any, "123")
        ).toEqual(null);
      });

      it("should fail on domain too long or containing non-ascii chars", async () => {
        const domainTooLong = new Array(256).fill("a").join("");
        try {
          await signDomainResolution(domainTooLong, "ens", "0x123");
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeTruthy();
        }

        try {
          await signDomainResolution("bug🐛.eth", "ens", "0x123");
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
            expect(e).toBeTruthy();
          }
        }
      });
    });

    describe("signAddressResolution", () => {
      beforeEach(() => {
        jest.restoreAllMocks();
        jest
          .spyOn(mockedAxios, "request")
          .mockImplementation(async ({ url }) => {
            const regex =
              /.*ens.*reverse.*0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045/;
            if (url && regex.test(url)) {
              return {
                data: {
                  payload:
                    "010103020101130103140101120021013c200b766974616c696b2e6574682214d8da6bf26964af9d7eed9e03e53415d37aa9604515473045022100eb0b71c3bc69990eb98a4518473f49821554b1fd3e29f9994246902edbab2e3f02204c1480d8d1d1ef5e7e545d31a95484a84da4a1827e4288d0efa888c664faf03d",
                },
              } as any;
            }
            return Promise.reject({ response: { status: 404 } }) as any;
          });
      });

      it("should return the APDU for a reverse ENS resolution", async () => {
        expect(
          await signAddressResolution(
            "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            "ens",
            "123"
          )
        ).toEqual(
          "010103020101130103140101120021013c200b766974616c696b2e6574682214d8da6bf26964af9d7eed9e03e53415d37aa9604515473045022100eb0b71c3bc69990eb98a4518473f49821554b1fd3e29f9994246902edbab2e3f02204c1480d8d1d1ef5e7e545d31a95484a84da4a1827e4288d0efa888c664faf03d"
        );
      });

      it("should return null for an unknown registry", async () => {
        expect(
          await signAddressResolution(
            "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            "test" as any,
            "123"
          )
        ).toEqual(null);
      });
    });
  });
});
