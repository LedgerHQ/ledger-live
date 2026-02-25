import { BigNumber } from "bignumber.js";
import expect from "expect";
import { scanOperations } from "../scanOperations";

// Module-level mock for getTransactions
const mockGetTransactions = jest.fn();
jest.mock("../../network", () => ({
  ...jest.requireActual("../../network"),
  getTransactions: (...args: unknown[]) => mockGetTransactions(...args),
}));

describe("scan transactions for multiple addresses", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([0, 1])("One address", async afterValue => {
    mockGetTransactions.mockResolvedValueOnce({
      nextPageAfter: null,
      transactions: [
        {
          subnetwork_id: "0000000000000000000000000000000000000000",
          transaction_id: "9b821c66588e25a4a1c2f81b63b0624b7210a76aedcc1d13e79a3c42e1ceef07",
          hash: "c4fe27e4e0d2528b006a90bbfac0e36f6b6bba8127de682583b2864e9d6ff498",
          mass: "2047",
          block_hash: [
            "fd12e6a2d4606f8fc7e43c9b02ca2d67851000117f0d5eee8814923d6a56ec14",
            "8591e9897e6713bcb7fbd4d9e77668124012a07953b1cda2b6634508de3f10f2",
            "7e06e8b2a22909fd02d430392d89207d709da1b649e732d4cc714ee3fc3072e4",
            "01d142912bca583580035b78a2b80a5845b61912e614673fa5f20d456cb9e15d",
            "7bded8dbe6fd711cf3daaa81ac1ae46aa2fe43c9d216fcfebb947c34a61f6b6b",
            "d5cdad1825351763e2d2edb623186c19167902185dcde7e6736a0410f8e2a08f",
            "7940d16ded962a9fc6d8d41943b3dd8eb264c0832ccb71199fbf75c8fcfa2f61",
          ],
          block_time: 1754762830110,
          is_accepted: true,
          accepting_block_hash: "c63ddfb813fb88dcb3f0efa011ddf1caf3d7739e55a5abc26bba9a8ee3ace1f6",
          accepting_block_blue_score: 191726843,
          inputs: [
            {
              transaction_id: "9b821c66588e25a4a1c2f81b63b0624b7210a76aedcc1d13e79a3c42e1ceef07",
              index: 0,
              previous_outpoint_hash:
                "e5a2123b15f39fdcd471366c91d7585b1fd6aa5eebaa425ee329d16a497f243c",
              previous_outpoint_index: "1",
              previous_outpoint_resolved: {
                transaction_id: "e5a2123b15f39fdcd471366c91d7585b1fd6aa5eebaa425ee329d16a497f243c",
                index: 1,
                amount: 500000000,
                script_public_key:
                  "2102727affb1792a7cac04082f1cc579167ae392691682c60701f7dfdc2d06b15b85ab",
                script_public_key_address:
                  "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
                script_public_key_type: "pubkeyecdsa",
                accepting_block_hash: "",
              },
              previous_outpoint_address:
                "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
              previous_outpoint_amount: 500000000,
              signature_script:
                "412ec2686a970b75be8668b80e3180d0ebc7c74daaac6fc7ee12692af44541aa945db641c1c6ae2b6c21434ac4444786022ed6ccad3e9472c25af9953f18869aa401",
              sig_op_count: "1",
            },
          ],
          outputs: [
            {
              transaction_id: "9b821c66588e25a4a1c2f81b63b0624b7210a76aedcc1d13e79a3c42e1ceef07",
              index: 0,
              amount: 20000000,
              script_public_key:
                "200000000000000000000000000000000000000000000000000000000000000000ac",
              script_public_key_address:
                "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
              script_public_key_type: "pubkey",
              accepting_block_hash: "",
            },
            {
              transaction_id: "9b821c66588e25a4a1c2f81b63b0624b7210a76aedcc1d13e79a3c42e1ceef07",
              index: 1,
              amount: 479949917,
              script_public_key:
                "2102727affb1792a7cac04082f1cc579167ae392691682c60701f7dfdc2d06b15b85ab",
              script_public_key_address:
                "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65",
              script_public_key_type: "pubkeyecdsa",
              accepting_block_hash: "",
            },
          ],
        },
        {
          subnetwork_id: "0000000000000000000000000000000000000000",
          transaction_id: "3a56a6da76007bd6b7ca691142489a803955838768cd110a67844865fc9ccdad",
          hash: "a258d078b917e9310929d0816362a8e4c7110a99cf25cbd8036d770af4fe5a21",
          mass: "2742",
          block_hash: [
            "af67df85976422f4c93cc8c5a450b76468ca622a75ecbca2e3b0dcc58614656e",
            "e4b3940e78074999f7a06e15b0c87f8c6597430627e925e304fbd415ef75e2cb",
            "8482a6cefc181f5cf226a79dc20f9596ab79a2456d105bad301692eaa251017a",
            "acdb57ed8b8057bad317e36a08b77f8f2695749b3f49d16a706215abfb820336",
          ],
          block_time: 1754346860989,
          is_accepted: true,
          accepting_block_hash: "a69903a9ba44e735913d5893654b1201ca44a6f4611d3d08557d26db52b4b8f9",
          accepting_block_blue_score: 187571391,
          inputs: [
            {
              transaction_id: "3a56a6da76007bd6b7ca691142489a803955838768cd110a67844865fc9ccdad",
              index: 0,
              previous_outpoint_hash:
                "72c8777ef361688d83ffb1ae0b678eed01f9a66cc8cb32f05aeec0bbc378139f",
              previous_outpoint_index: "0",
              previous_outpoint_resolved: {
                transaction_id: "72c8777ef361688d83ffb1ae0b678eed01f9a66cc8cb32f05aeec0bbc378139f",
                index: 0,
                amount: 300000000,
                script_public_key:
                  "207b5065f6dee14d29d74ca61f55ac70b2c3f160e395fc93d680a0950c80f33e42ac",
                script_public_key_address:
                  "kaspa:qpa4qe0kmms562whfjnp74dvwzev8utquw2ley7kszsf2ryq7vlyyq3dcdmre",
                script_public_key_type: "pubkey",
                accepting_block_hash: "",
              },
              previous_outpoint_address:
                "kaspa:qpa4qe0kmms562whfjnp74dvwzev8utquw2ley7kszsf2ryq7vlyyq3dcdmre",
              previous_outpoint_amount: 300000000,
              signature_script:
                "41aec32ab5e276661ba53582cf44970da8397211294af577f34add1aa76a7d8986f3222ae19bbde94ce4afef8044b9428f2ba470e6a5f7c04a30590dd20221796f01",
              sig_op_count: "1",
            },
            {
              transaction_id: "3a56a6da76007bd6b7ca691142489a803955838768cd110a67844865fc9ccdad",
              index: 1,
              previous_outpoint_hash:
                "92d6c3f5285e6d74487e1127592c59e3bff144e62fc133c733f8ede36b7e8ca9",
              previous_outpoint_index: "1",
              previous_outpoint_resolved: {
                transaction_id: "92d6c3f5285e6d74487e1127592c59e3bff144e62fc133c733f8ede36b7e8ca9",
                index: 1,
                amount: 1699970092,
                script_public_key:
                  "207b5065f6dee14d29d74ca61f55ac70b2c3f160e395fc93d680a0950c80f33e42ac",
                script_public_key_address:
                  "kaspa:qpa4qe0kmms562whfjnp74dvwzev8utquw2ley7kszsf2ryq7vlyyq3dcdmre",
                script_public_key_type: "pubkey",
                accepting_block_hash: "",
              },
              previous_outpoint_address:
                "kaspa:qpa4qe0kmms562whfjnp74dvwzev8utquw2ley7kszsf2ryq7vlyyq3dcdmre",
              previous_outpoint_amount: 1699970092,
              signature_script:
                "418a3a04908ec122cb6408a32dd602c2a5bfbfa37d21bd0fe6e6f910b2d841edc67724e68f954a7132b073d6162eb14e0d577c3a23679fd2cbfbab8c479d869f7101",
              sig_op_count: "1",
            },
          ],
          outputs: [
            {
              transaction_id: "3a56a6da76007bd6b7ca691142489a803955838768cd110a67844865fc9ccdad",
              index: 0,
              amount: 1999967350,
              script_public_key:
                "200000000000000000000000000000000000000000000000000000000000000000ac",
              script_public_key_address:
                "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
              script_public_key_type: "pubkey",
              accepting_block_hash: "",
            },
          ],
        },
      ],
    });

    const address = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";

    const result = await scanOperations([address], "", afterValue);
    expect(result.length).toBe(2);

    const exampleTx = result.find(
      res => res.hash === "9b821c66588e25a4a1c2f81b63b0624b7210a76aedcc1d13e79a3c42e1ceef07",
    );
    expect(exampleTx).toBeDefined();

    expect(exampleTx?.fee.eq(BigNumber(50083))).toBe(true);
    expect(exampleTx?.value.eq(BigNumber(480000000))).toBe(true);

    expect(exampleTx?.type).toBe("OUT");
    expect(exampleTx?.senders.length).toBe(1);
    expect(exampleTx?.senders[0]).toBe(
      "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
    );
    expect(exampleTx?.recipients.length).toBe(2);
    expect(
      exampleTx?.recipients.includes(
        "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
      ),
    ).toBe(true);
  });

  it("Empty input (mining tx)", async () => {
    mockGetTransactions.mockResolvedValueOnce({
      nextPageAfter: null,
      transactions: [
        {
          subnetwork_id: "0100000000000000000000000000000000000000",
          transaction_id: "8794d061cf77f6ef3d77c3655b0f42e2a23911bd849508be6c88e75cb2f1a1a1",
          hash: "d4d1a311fa063e007f93955ca7548f4047055b4bdff89c99919fc48f546c9b54",
          mass: null,
          payload:
            "e5bf3f0e00000000faff041a0000000000002220f027dfb4b0f0a246130699bd0384036fe4e207458cf4d054657ed7c22afd427aac312e302e302f766961627463",
          block_hash: ["cad9d41ce79ffd1002459c9cc0de6861c9c0cd9cbd4b4ee8d0d5e10c537db063"],
          block_time: 1759498092403,
          is_accepted: true,
          accepting_block_hash: "746bc1544081944841aa4697f5210ea809c61e7b280c59ee05beb43e44383dd6",
          accepting_block_blue_score: 239058922,
          accepting_block_time: 1759498092968,
          inputs: null,
          outputs: [
            {
              transaction_id: "8794d061cf77f6ef3d77c3655b0f42e2a23911bd849508be6c88e75cb2f1a1a1",
              index: 0,
              amount: 436535290,
              script_public_key:
                "20f027dfb4b0f0a246130699bd0384036fe4e207458cf4d054657ed7c22afd427aac",
              script_public_key_address:
                "kaspa:qrcz0ha5krc2y3snq6vm6quyqdh7fcs8gkx0f5z5v4ld0s32l4p850cvk8udv",
              script_public_key_type: "pubkey",
            },
            {
              transaction_id: "8794d061cf77f6ef3d77c3655b0f42e2a23911bd849508be6c88e75cb2f1a1a1",
              index: 1,
              amount: 436535290,
              script_public_key:
                "20882bfecd3aeee23b8aec89fd8be22dccd038b0a18534bec2cb4f0292b7d6d699ac",
              script_public_key_address:
                "kaspa:qzyzhlkd8thwywu2ajylmzlz9hxdqw9s5xznf0kzed8s9y4h6mtfj222rtgcn",
              script_public_key_type: "pubkey",
            },
            {
              transaction_id: "8794d061cf77f6ef3d77c3655b0f42e2a23911bd849508be6c88e75cb2f1a1a1",
              index: 2,
              amount: 436535290,
              script_public_key:
                "20ec56e7099fea3e9339407486c578d69f417598fd83c6d241f1fa6eae93eec217ac",
              script_public_key_address:
                "kaspa:qrk9decfnl4rayeegp6gd3tc6605zavclkpud5jp78axat5namppwt050d57j",
              script_public_key_type: "pubkey",
            },
            {
              transaction_id: "8794d061cf77f6ef3d77c3655b0f42e2a23911bd849508be6c88e75cb2f1a1a1",
              index: 3,
              amount: 436535290,
              script_public_key:
                "20ec56e7099fea3e9339407486c578d69f417598fd83c6d241f1fa6eae93eec217ac",
              script_public_key_address:
                "kaspa:qrk9decfnl4rayeegp6gd3tc6605zavclkpud5jp78axat5namppwt050d57j",
              script_public_key_type: "pubkey",
            },
            {
              transaction_id: "8794d061cf77f6ef3d77c3655b0f42e2a23911bd849508be6c88e75cb2f1a1a1",
              index: 4,
              amount: 12341234,
              script_public_key:
                "20d809eaac35b196372cd5944a961f33abf853d8909a0d82d845caee78db45ed4fac",
              script_public_key_address:
                "kaspa:qrvqn64vxkcevdev6k2y49slxw4ls57cjzdqmqkcgh9wu7xmghk57v4ehla0t",
              script_public_key_type: "pubkey",
            },
            {
              transaction_id: "8794d061cf77f6ef3d77c3655b0f42e2a23911bd849508be6c88e75cb2f1a1a1",
              index: 5,
              amount: 436535290,
              script_public_key:
                "20f027dfb4b0f0a246130699bd0384036fe4e207458cf4d054657ed7c22afd427aac",
              script_public_key_address:
                "kaspa:qrcz0ha5krc2y3snq6vm6quyqdh7fcs8gkx0f5z5v4ld0s32l4p850cvk8udv",
              script_public_key_type: "pubkey",
            },
            {
              transaction_id: "8794d061cf77f6ef3d77c3655b0f42e2a23911bd849508be6c88e75cb2f1a1a1",
              index: 6,
              amount: 436535290,
              script_public_key:
                "207bbb32e8bbec2351e873181a1a07b2f60e2f048b5302b71177bfb28c0f143da6ac",
              script_public_key_address:
                "kaspa:qpamkvhgh0kzx50gwvvp5xs8ktmqutcy3dfs9dc3w7lm9rq0zs76vf959mmrp",
              script_public_key_type: "pubkey",
            },
            {
              transaction_id: "8794d061cf77f6ef3d77c3655b0f42e2a23911bd849508be6c88e75cb2f1a1a1",
              index: 7,
              amount: 436636914,
              script_public_key:
                "20f027dfb4b0f0a246130699bd0384036fe4e207458cf4d054657ed7c22afd427aac",
              script_public_key_address:
                "kaspa:qrcz0ha5krc2y3snq6vm6quyqdh7fcs8gkx0f5z5v4ld0s32l4p850cvk8udv",
              script_public_key_type: "pubkey",
            },
          ],
        },
      ],
    });

    const address = "kaspa:qrvqn64vxkcevdev6k2y49slxw4ls57cjzdqmqkcgh9wu7xmghk57v4ehla0t";

    const result = await scanOperations([address], "", 0);
    expect(result.length).toBe(1);

    const exampleTx = result.find(
      res => res.hash === "8794d061cf77f6ef3d77c3655b0f42e2a23911bd849508be6c88e75cb2f1a1a1",
    );
    expect(exampleTx).toBeDefined();
    expect(exampleTx?.fee.eq(BigNumber(0))).toBe(true);
    expect(exampleTx?.value.eq(BigNumber(12341234))).toBe(true);
    expect(exampleTx?.type).toBe("IN");
    expect(exampleTx?.senders.length).toBe(0);
    expect(exampleTx?.recipients.length).toBe(8);
    expect(
      exampleTx?.recipients.includes(
        "kaspa:qrvqn64vxkcevdev6k2y49slxw4ls57cjzdqmqkcgh9wu7xmghk57v4ehla0t",
      ),
    ).toBe(true);
  });
});
