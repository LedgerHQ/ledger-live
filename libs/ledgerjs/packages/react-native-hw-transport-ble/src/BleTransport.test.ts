import BleTransport from "../src/BleTransport";
import { Subscription } from "rxjs";

/**
 * It is essential to mock the BLE component of a BLE transport to verify
 * the reliability of the connect/reconnect/disconnect logic, which is decoupled
 * from the managing logic of live-common or any other implementation.
 * Although it may seem trivial, such an approach is necessary to ensure
 * that the implementation is robust and dependable.
 *
 * To this end, a mocked react-native-ble-plx has been developed specifically
 * to cover test cases. It should be noted that this mock is not comprehensive
 * and may require further refinement to meet all requirements.
 */
jest.mock("react-native-ble-plx", () => {
  // Set of callbacks that we can trigger from our tests.
  const callbacks: { [key: string]: (...args: any[]) => void } = {};

  return {
    BleErrorCode: {
      ScanStartFailed: 0,
    },
    BleManager: function () {
      const dynamicProps = {
        isConnected: true,
      };

      return {
        onStateChange: (callback) => {
          setTimeout(() => callback("PoweredOn"), 500);
          return new Subscription();
        },
        cancelDeviceConnection: async () => {
          dynamicProps.isConnected = false;
          callbacks?.onDisconnected(null);
        },
        devices: () => [],
        connectedDevices: () => [],
        connectToDevice: () => {
          dynamicProps.isConnected = true;

          return {
            isConnectable: null,
            serviceData: null,
            overflowServiceUUIDs: null,
            txPowerLevel: null,
            serviceUUIDs: null,
            rssi: null,
            mtu: 0,
            name: "Ledger Stax 2783",
            localName: null,
            id: "20EDD96F-7430-6E33-AB22-DD8AAB857CD4",
            manufacturerData: null,
            solicitedServiceUUIDs: null,

            isConnected: () => {
              return dynamicProps.isConnected;
            },

            onDisconnected: (callback) => {
              callbacks["onDisconnected"] = () => callback(null); // Disconnect without an error
              return new Subscription();
            },
            discoverAllServicesAndCharacteristics: () => {},
            characteristicsForService: (uuid) => {
              if (uuid === "13d63400-2c97-6004-0000-4c6564676572") {
                return [
                  {
                    // Device responses
                    serviceUUID: "13d63400-2c97-6004-0000-4c6564676572",
                    isIndicatable: false,
                    isNotifiable: true,
                    isWritableWithoutResponse: false,
                    isWritableWithResponse: false,
                    serviceID: 105553179758272,
                    isReadable: false,
                    deviceID: "20EDD96F-7430-6E33-AB22-DD8AAB857CD4",
                    isNotifying: false,
                    value:
                      "BQAAACMzIAAECTEuMC4wLXJjOQTuAAALBDUuMTUEMC4zNQEAAQCQAA==",
                    id: 105553399124864,
                    uuid: "13d63400-2c97-6004-0001-4c6564676572",
                    monitor: (cb) => {
                      callbacks["onDeviceResponse"] = cb;
                      return new Subscription();
                    },
                  },
                  {
                    // Write
                    isNotifying: false,
                    value: null,
                    isIndicatable: false,
                    id: 105553399131872,
                    uuid: "13d63400-2c97-6004-0002-4c6564676572",
                    isReadable: false,
                    deviceID: "20EDD96F-7430-6E33-AB22-DD8AAB857CD4",
                    serviceID: 105553179758272,
                    serviceUUID: "13d63400-2c97-6004-0000-4c6564676572",
                    isWritableWithoutResponse: false,
                    isWritableWithResponse: true,
                    isNotifiable: false,
                  },
                  {
                    // Used for write without response
                    isWritableWithoutResponse: true,
                    isWritableWithResponse: false,
                    isNotifiable: false,
                    deviceID: "20EDD96F-7430-6E33-AB22-DD8AAB857CD4",
                    isReadable: false,
                    value: null,
                    isNotifying: false,
                    isIndicatable: false,
                    id: 105553399132064,
                    uuid: "13d63400-2c97-6004-0003-4c6564676572",
                    serviceUUID: "13d63400-2c97-6004-0000-4c6564676572",
                    serviceID: 105553179758272,
                    writeWithoutResponse: async (raw) => {
                      if (!dynamicProps.isConnected)
                        throw new Error("Device is not connected");

                      const hex = Buffer.from(raw, "base64").toString("hex");
                      let value: Buffer;

                      switch (hex) {
                        // MTU handshake
                        case "0800000000":
                          value = Buffer.from("080000000199", "hex");
                          break;
                        // getAppAndVersion - returning BOLOS on 1.0.0-rc9
                        case "0500000005b010000000":
                          value = Buffer.from(
                            "05000000130105424f4c4f5309312e302e302d7263399000",
                            "hex"
                          );
                          break;
                        // just used for a non resolving apdu
                        case "0500000005b020000000":
                          setTimeout(() => {
                            callbacks?.onDeviceResponse(null, {
                              value: Buffer.from("05000000029000", "hex"),
                            });
                          }, 600);
                          return; // Called after a delay to give time for the disconnect
                        default:
                          throw new Error("some generic failure");
                      }
                      // Introduce some logic to actually respond.
                      callbacks?.onDeviceResponse(null, {
                        value,
                      });
                    },
                  },
                ];
              }
              throw Error("Generic mocked error");
            },
          };
        },
      };
    },
  };
});

describe("BleTransport connectivity test coverage", () => {
  const deviceId = "20EDD96F-7430-6E33-AB22-DD8AAB857CD4";

  describe("Device available and already paired", () => {
    it("should find the device, connect, negotiate MTU", async () => {
      const transport = await BleTransport.open(deviceId);
      expect(transport.device.isConnected()).toBe(true);
    });

    it("should be disconnectable, and cleanup", async () => {
      const transport = await BleTransport.open(deviceId);
      await BleTransport.disconnect(deviceId);
      expect(transport.isConnected).toBe(false);
    });

    it("should disconnect in 500ms (5s default) after calling close", async () => {
      const transport = await BleTransport.open(deviceId);
      expect(transport.isConnected).toBe(true);

      BleTransport.disconnectTimeoutMs = 500;
      await transport.close();

      // Expect the timeout for disconnection to be set
      expect(transport.disconnectTimeout).not.toBe(undefined);
      let resolve;

      transport.on("disconnect", () => {
        resolve();
      });

      return await new Promise((_resolve, _reject) => {
        resolve = _resolve;
      });
    });

    it("should cancel disconnect if new connection is made", async () => {
      const transport = await BleTransport.open(deviceId);
      expect(transport.isConnected).toBe(true);

      BleTransport.disconnectTimeoutMs = 500;
      await transport.close();

      // Expect the timeout for disconnection to be set
      expect(transport.disconnectTimeout).not.toBe(undefined);
      // Nb due to the different environments, the timeout behaves differently here
      // and I can't check against a number for it to be cleared or not.
      expect((transport.disconnectTimeout as any)._destroyed).toBe(false);
      await BleTransport.open(deviceId);
      expect((transport.disconnectTimeout as any)._destroyed).toBe(true);
    });

    it("should cancel disconnect if already disconnected", async () => {
      const transport = await BleTransport.open(deviceId);
      expect(transport.isConnected).toBe(true);

      BleTransport.disconnectTimeoutMs = 500;
      await transport.close();

      // Expect the timeout for disconnection to be set
      expect(transport.disconnectTimeout).not.toBe(undefined);
      // Nb due to the different environments, the timeout behaves differently here
      // and I can't check against a number for it to be cleared or not.
      expect((transport.disconnectTimeout as any)._destroyed).toBe(false);
      await BleTransport.disconnect(deviceId);
      expect((transport.disconnectTimeout as any)._destroyed).toBe(true);
    });

    it("should handle exchanges if all goes well", async () => {
      const transport = await BleTransport.open(deviceId);
      expect(transport.isConnected).toBe(true);

      const response = await transport.exchange(
        Buffer.from("b010000000", "hex")
      );
      expect(response.toString("hex")).toBe(
        "0105424f4c4f5309312e302e302d7263399000"
      );
    });

    it("should throw on exchanges if disconnected", async () => {
      const transport = await BleTransport.open(deviceId);
      expect(transport.isConnected).toBe(true);
      await BleTransport.disconnect(deviceId);
      await expect(
        transport.exchange(Buffer.from("b010000000", "hex"))
      ).rejects.toThrow("Device is not connected"); // More specific errors some day.
    });

    it("should disconnect if close is called, even if pending response", (done) => {
      // This is actually a very important test, if we have an ongoing apdu response,
      // as in, the device never replied, but we expressed the intention of disconnecting
      // we will give it a few seconds and then disconnect regardless. Otherwise we fall
      // in the never ending await trap.
      async function asyncFn() {
        const transport = await BleTransport.open(deviceId);
        expect(transport.isConnected).toBe(true);
        transport.exchange(Buffer.from("b020000000", "hex"));
        BleTransport.disconnectTimeoutMs = 500;

        transport.on("disconnect", () => {
          done(); // If this is never called, then we're still waiting.
        });
        await transport.close();

        // Expect the timeout for disconnection to be set
        expect(transport.disconnectTimeout).not.toBe(undefined);
      }

      asyncFn();
    });
  });
});
