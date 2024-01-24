import axios from "axios";
import {
  getEIP712FieldsDisplayedOnNano,
  getFiltersForMessage,
  isEIP712Message,
  sortObjectAlphabetically,
} from "../../../message/EIP712/index";
import { dynamicCAL, messageNotInCAL } from "../../fixtures/dynamicCAL";
import complexMessage from "../../fixtures/messages/5.json";
import messageInCAL from "../../fixtures/messages/2.json";

const CAL = jest.requireActual("../../fixtures/CAL").default;

jest.mock("axios");
jest.mock("@ledgerhq/cryptoassets/data/eip712", () => require("../../fixtures/CAL"));

describe("evm-tools", () => {
  describe("message", () => {
    describe("EIP712", () => {
      describe("isEIP712Message", () => {
        it("should return false with undefined", () => {
          expect(isEIP712Message(undefined)).toBe(false);
        });

        it("should return false with empty string", () => {
          expect(isEIP712Message("")).toBe(false);
        });

        it("should return false with string", () => {
          expect(isEIP712Message("anything")).toBe(false);
        });

        it("should return false with missing types", () => {
          expect(
            isEIP712Message({
              types: {},
            }),
          ).toBe(false);
          expect(
            isEIP712Message({
              types: {},
              primaryType: "",
            }),
          ).toBe(false);
          expect(
            isEIP712Message({
              types: {},
              primaryType: "",
              domain: {},
            }),
          ).toBe(false);
        });

        it("should return true with correct keys", () => {
          expect(
            isEIP712Message({
              types: {},
              primaryType: "",
              domain: {},
              message: {},
            }),
          ).toBe(true);
        });
      });

      describe("sortlphabetically", () => {
        it("should order the keys by alphabetical order", () => {
          const obj = {
            F: {
              Q: 1,
              P: 2,
            },
            E: {
              O: 1,
              N: 2,
            },
            D: {
              M: 1,
              L: 2,
            },
            C: {
              K: 1,
              J: 2,
            },
            B: {
              I: 1,
              H: 2,
            },
            A: {
              G: 1,
              F: 2,
            },
          };
          const expectedObj = {
            A: {
              F: 2,
              G: 1,
            },
            B: {
              H: 2,
              I: 1,
            },
            C: {
              J: 2,
              K: 1,
            },
            D: {
              L: 2,
              M: 1,
            },
            E: {
              N: 2,
              O: 1,
            },
            F: {
              P: 2,
              Q: 1,
            },
          };

          expect(sortObjectAlphabetically(obj)).toEqual(expectedObj);
        });
      });

      describe("getFiltersForMessage", () => {
        it("should find the filters for a message from dynamic CAL", async () => {
          (axios.get as jest.Mock).mockReturnValueOnce({
            data: dynamicCAL,
          });

          const result = await getFiltersForMessage(messageNotInCAL, "http://CAL-ADDRESS");
          expect(result).toEqual("found");
        });

        it("should find the filters for a message in static CAL if the message is not in dynamic CAL return", async () => {
          (axios.get as jest.Mock).mockReturnValueOnce({
            data: {},
          });
          const schemaHash = "d8e4f2bd77f7562e99ea5df4adb127291a2bfbc225ae55450038f27f";

          const result = await getFiltersForMessage(messageInCAL);
          expect(result).toEqual(CAL[`1:0x7f268357a8c2552623316e2562d90e642bb538e5:${schemaHash}`]);
        });

        it("should find the filters for a message in static CAL if no dynamic CAL URI is provided", async () => {
          const schemaHash = "d8e4f2bd77f7562e99ea5df4adb127291a2bfbc225ae55450038f27f";

          const result = await getFiltersForMessage(messageInCAL);
          expect(result).toEqual(CAL[`1:0x7f268357a8c2552623316e2562d90e642bb538e5:${schemaHash}`]);
        });

        it("should find the filters for a message not in dynamic CAL if in static CAL", async () => {
          (axios.get as jest.Mock).mockRejectedValue(new Error());
          const schemaHash = "d8e4f2bd77f7562e99ea5df4adb127291a2bfbc225ae55450038f27f";

          const result = await getFiltersForMessage(messageInCAL, "http://CAL-ADDRESS");
          expect(result).toEqual(CAL[`1:0x7f268357a8c2552623316e2562d90e642bb538e5:${schemaHash}`]);
        });
      });

      describe("getEIP712FieldsDisplayedOnNano", () => {
        beforeEach(() => {
          jest.resetAllMocks();
          (axios.get as jest.Mock).mockReturnValueOnce({
            data: {},
          });
        });

        it("shouldn't throw for an invalid message (not EIP712)", async () => {
          const fields = await getEIP712FieldsDisplayedOnNano({} as any);

          expect(fields).toBe(null);
        });

        it("should return the correct fields for a message with filters", async () => {
          const fields = await getEIP712FieldsDisplayedOnNano(messageInCAL);

          expect(fields).toEqual([
            {
              label: "Contract",
              value: "Mace Windu",
            },
            {
              label: "Maker",
              value: "0x112f0732e59e7600768dfc35ba744b89f2356cd8",
            },
            {
              label: "Taker",
              value: "0x0000000000000000000000000000000000000000",
            },
            {
              label: "Base Price",
              value: "2000000000000000000",
            },
            {
              label: "Expiration Time",
              value: "1646089435",
            },
          ]);
        });

        it("should return the correct fields for a message without filters", async () => {
          const fields = await getEIP712FieldsDisplayedOnNano(messageNotInCAL);

          expect(fields).toEqual([
            {
              label: "name",
              value: "Message Not In CAL",
            },
            {
              label: "version",
              value: "1",
            },
            {
              label: "chainId",
              value: "1",
            },
            {
              label: "verifyingContract",
              value: "0xd007d007A0D06D4fbbF627410eADE051FD66FC59",
            },
            {
              label: "salt",
              value: "0x446f6f7420446f6f74206c657320746f6361726473206475205661756c74",
            },
            {
              label: "Message hash",
              value: "0x00ea67203532137e1166447586859962e977f0ce26dc2b53c2f5c9415665a52d",
            },
          ]);
        });

        it("should return the correct fields for a message with multidimensional filters", async () => {
          const fields = await getEIP712FieldsDisplayedOnNano(complexMessage);

          expect(fields).toEqual([
            {
              label: "Contract",
              value: "R2D2",
            },
            {
              label: "Document",
              value: [
                "<did:key:z6MkgFneaaMjN6zybqLNXgt4YfmVx2XZhzPdDyk4ZK81daHZ>",
                "<https://www.w3.org/TR/owl-ref/#sameAs-def>",
                '"did:ethr:0xf7398bacf610bb4e3b567811279fcb3c41919f89"',
                "<urn:uuid:14ab6047-bf2d-4fde-9564-51dead126ffb>",
                "<https://www.w3.org/2018/credentials#credentialSubject>",
                "<did:key:z6MkgFneaaMjN6zybqLNXgt4YfmVx2XZhzPdDyk4ZK81daHZ>",
                "<urn:uuid:14ab6047-bf2d-4fde-9564-51dead126ffb>",
                "<https://www.w3.org/2018/credentials#issuanceDate>",
                '"2021-03-04T21:08:22.615Z"^^<http://www.w3.org/2001/XMLSchema#dateTime>',
                "<urn:uuid:14ab6047-bf2d-4fde-9564-51dead126ffb>",
                "<https://www.w3.org/2018/credentials#issuer>",
                "<did:ethr:0xf7398bacf610bb4e3b567811279fcb3c41919f89>",
                "<urn:uuid:14ab6047-bf2d-4fde-9564-51dead126ffb>",
                "<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>",
                "<https://www.w3.org/2018/credentials#VerifiableCredential>",
              ],
            },
            {
              label: "Proof",
              value: [
                "_:c14n0",
                "<http://purl.org/dc/terms/created>",
                '"2021-03-04T21:08:22.616Z"^^<http://www.w3.org/2001/XMLSchema#dateTime>',
                "_:c14n0",
                "<https://w3id.org/security#proofPurpose>",
                "<https://w3id.org/security#assertionMethod>",
                "_:c14n0",
                "<https://w3id.org/security#verificationMethod>",
                "<did:ethr:0xf7398bacf610bb4e3b567811279fcb3c41919f89#Eip712Method2021>",
                "_:c14n0",
                "<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>",
                "<https://w3id.org/security#Eip712Signature2021>",
              ],
            },
            {
              label: "Depth",
              value: ["1", "2", "3"],
            },
          ]);
        });
      });
    });
  });
});
