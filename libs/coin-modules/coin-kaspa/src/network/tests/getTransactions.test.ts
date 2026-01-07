import { getTransactions } from "../index";

describe("getTransactions function", () => {
  beforeEach(() => {
    // Clear all mocks before each test to avoid interference
    jest.clearAllMocks();
  });
  it("should fetch TXs for (burn)address from real API", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      headers: {
        get: jest.fn(() => ""),
      },
      json: async () => [
        {
          subnetwork_id: "0000000000000000000000000000000000000000",
          transaction_id: "72cee02d1c323e0a9154ebac60630f7e370eb9149afaa3eab9277a284c343964",
          hash: "f383585dd39e9459dd97c0551c359e882c8248db618b8726ff9ed57dfb165440",
          mass: "2036",
          block_hash: [
            "89193a460ae5c9dfc5983b72e71ffba2699d75420e906b4475e69861d62fa124",
            "e194ab7d88ae78a212a388309f0994c3a819dc8d0a5c1f69bd0c811c9017e4bd",
          ],
          block_time: 1733730605449,
          is_accepted: true,
          accepting_block_hash: "9a2bdd094ae393f94f1a1dee87a9f467d406f8b2a7d9fd9becf9019f0e5eb922",
          accepting_block_blue_score: 95828655,
          inputs: [
            {
              transaction_id: "72cee02d1c323e0a9154ebac60630f7e370eb9149afaa3eab9277a284c343964",
              index: 0,
              previous_outpoint_hash:
                "6735abfcfeade8fdad092afd5a51ed6089b761fec30ee46a66db3a59ef009b74",
              previous_outpoint_index: "0",
              previous_outpoint_resolved: null,
              previous_outpoint_address: null,
              previous_outpoint_amount: null,
              signature_script:
                "41b317450a27b848bb8e500cdacbf0fd53b1c6e7dfc9e9752e9f4a1892a8b63508f50a47e96acd45995223fb5d41e791f147d7f52fe5d13418a8a7e68cfa2c638901",
              sig_op_count: "1",
            },
          ],
          outputs: [
            {
              transaction_id: "72cee02d1c323e0a9154ebac60630f7e370eb9149afaa3eab9277a284c343964",
              index: 0,
              amount: 69000000,
              script_public_key:
                "200000000000000000000000000000000000000000000000000000000000000000ac",
              script_public_key_address:
                "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
              script_public_key_type: "pubkey",
              accepting_block_hash: null,
            },
            {
              transaction_id: "72cee02d1c323e0a9154ebac60630f7e370eb9149afaa3eab9277a284c343964",
              index: 1,
              amount: 230984512,
              script_public_key:
                "2055b8f71e0175003a8ad8ce895d0f0ed6ca84d131115192df4e3842c5d8b049f7ac",
              script_public_key_address:
                "kaspa:qp2m3ac7q96sqw52mr8gjhg0pmtv4px3xyg4ryklfcuy93wckpylwuna456vq",
              script_public_key_type: "pubkey",
              accepting_block_hash: null,
            },
          ],
        },
        {
          subnetwork_id: "0000000000000000000000000000000000000000",
          transaction_id: "0ae596c60c4a8b8ff8f9397e70266f68d32effb79ad37826b958f41e40759f90",
          hash: "92d44bdb0fcb210650f7bd62043cb9c0c2013053ac54d1f5ffcb9c016f42f2ea",
          mass: "1624",
          block_hash: ["46ce80a5ff71f84b2a37d7ea615cd93edc4fcacf45a7a95d1d6e51d85360a72e"],
          block_time: 1730564218472,
          is_accepted: true,
          accepting_block_hash: "d16be8f74302ed5fb2ee9873cc4e916aecd3ac346639f44fd5cc4fb0ec7dd076",
          accepting_block_blue_score: 92661331,
          inputs: [
            {
              transaction_id: "0ae596c60c4a8b8ff8f9397e70266f68d32effb79ad37826b958f41e40759f90",
              index: 0,
              previous_outpoint_hash:
                "48c1f630fe28ec4be1fabb8101dade0022d74dbfadab75e52619d5dde6ffdd5f",
              previous_outpoint_index: "0",
              previous_outpoint_resolved: null,
              previous_outpoint_address: null,
              previous_outpoint_amount: null,
              signature_script:
                "419e980873eae21f245208162b341bf62b4702a56d94cd0ab55014359001bf3597bf3936b3cb1634f51c232567f2fa1fdd03fefe126ede1c320e4fa2574aa2506f01",
              sig_op_count: "1",
            },
          ],
          outputs: [
            {
              transaction_id: "0ae596c60c4a8b8ff8f9397e70266f68d32effb79ad37826b958f41e40759f90",
              index: 0,
              amount: 3499890212,
              script_public_key:
                "200000000000000000000000000000000000000000000000000000000000000000ac",
              script_public_key_address:
                "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
              script_public_key_type: "pubkey",
              accepting_block_hash: null,
            },
          ],
        },
        {
          subnetwork_id: "0000000000000000000000000000000000000000",
          transaction_id: "0958e37fef35f5cc5f53e383f19a1fb589d110bd2e967a34122a48dea1232cb9",
          hash: "7c9881a09bbacefad1f3ed199a7ff531431675dd9e479a46deb97c71aa35fe02",
          mass: "2036",
          block_hash: ["f926e1d1ebb621ce9dc87efca9c4bc02110dee8078ea304c21ab7c65a3d7285b"],
          block_time: 1730187373390,
          is_accepted: true,
          accepting_block_hash: "7bf390afb0a46cd5cc2140540d1aea36f040613873a39fb7d86920ee8ea1cee6",
          accepting_block_blue_score: 92283556,
          inputs: [
            {
              transaction_id: "0958e37fef35f5cc5f53e383f19a1fb589d110bd2e967a34122a48dea1232cb9",
              index: 0,
              previous_outpoint_hash:
                "ba4d2b0d594e61b003036231c88abcc9a5c1f5ef2d6ea878f8b25a2ab9146d2a",
              previous_outpoint_index: "0",
              previous_outpoint_resolved: null,
              previous_outpoint_address: null,
              previous_outpoint_amount: null,
              signature_script:
                "41a157a87e0a98d18fa4bd2b3a21925e4d961861b84a1be6bf37e495e49dba28406692ce0f4075c7b2ddc08edd6bb7db511ac6a2fd48e30cd88e38cc3999294ec301",
              sig_op_count: "1",
            },
          ],
          outputs: [
            {
              transaction_id: "0958e37fef35f5cc5f53e383f19a1fb589d110bd2e967a34122a48dea1232cb9",
              index: 0,
              amount: 100000000,
              script_public_key:
                "200000000000000000000000000000000000000000000000000000000000000000ac",
              script_public_key_address:
                "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
              script_public_key_type: "pubkey",
              accepting_block_hash: null,
            },
            {
              transaction_id: "0958e37fef35f5cc5f53e383f19a1fb589d110bd2e967a34122a48dea1232cb9",
              index: 1,
              amount: 1557776051,
              script_public_key:
                "20ba05376ad62963e66d4a92ac2c73f8183dafcc66dc50960006359a7ad01a75cdac",
              script_public_key_address:
                "kaspa:qzaq2dm26c5k8endf2f2ctrnlqvrmt7vvmw9p9sqqc6e57ksrf6u6xafdlpx5",
              script_public_key_type: "pubkey",
              accepting_block_hash: null,
            },
          ],
        },
      ],
    });
    const address = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";
    const result = await getTransactions(address);
    expect(result.transactions.length).toBe(3);
  });

  it("should return an error if fetch returns a 500 response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const address = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";
    await expect(getTransactions(address)).rejects.toThrowError("Network response was not ok.");
  });
});
