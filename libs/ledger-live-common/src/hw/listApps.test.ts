import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import listApps from "./listApps";

describe("getAppAndVersion", () => {
  it("should return the correct apps list installed", async () => {
    // Given
    const mockTransport = await openTransportReplayer(
      RecordStore.fromString(`
        => e0de000000
        <= 014a00a9c800ca7997e619639b55841fc17802ff0e88073206953ccedac2860a024079e6894236a6b759373ec2a02c27883887170dfe4a2cf13f96ded7d661ef0fb708f435c0044c69646f4e08f1c25008b76cb91b2c9f06d4036b83225ca03dafe922968497f68cb448d134092e46d036416e9c8cc55d50213d5bb8f28c33806ec751a497692499431650c0932ccde10845786368616e67659000
        => e0df000000
        <= 01490a09ca404646ed6a3999d47347136031ec66e6d391c6b58e62d28713c48893f6a56b583b0863d9aec4e2972246ec6d5ab15ab0da9d66d7e3be0a256499b224ca7d4b6748035852504e14abca4034da55bc1d6ae3ff31d07f7d16850bc70bead8f9454cfcbec33215b1a95ff1a1278a1ee8477fa97764f535be158676e468410ad6e12649bc017040906f5d58fa08457468657265756d9000
        => e0df000000
        <= 014a0da7ca009f838b6d044cb86ecd6d4934db1d4cdf2e51df62f4d2e60dafd1f7597355d33e5c9b102ee3a64ff75bef54902b38951c87fff03ceb79bddb17da3cb4c7f3b2d3044e4541524d0dfdca505a8389806255e4025206a00d1a60d816973c3eca7fcee0d4a412b200b7e70f75cf33fb31b401fda1ad440f0a2babb1ac5a833a3ddd06a5a09481300316f6b07b07426974636f696e9000
        => e0df000000
        <= 01490ab5ca00d5ff36dd1cc55f86ff352575c4f8cf4715f5ada3412882ea92bb8170d119394a4768f66d1b1163fee7d5e4560829d1e0858c4f9a66f1a49c6524d8424b5a383903544f4e4c0e75ca00640a553cf9c2c065b123f9af3934060d3f96e1de7b6118d58597144b3d29988c851ed223af8854a8344cf97e4b19361af2a833561cf8801842afa6e9fcbbf33806436f736d6f739000
        => e0df000000
        <= 014c0c39ca004210cfef57e499e802584b8dd537fb39cac138f3a62324f7033de15f118d19d208e84ce6dcf7bffee53dcc1afd15401f90d97d19ea6780fb310ef79475c6545706536f6c616e614f1aa5c200e202a028b1cbc6942b8b6b021e71d9ba416b0f30fc74773f24ba6ede1db90ab0d505d9fc1a170320f13b252cfc508dd44a7cc84133da97a62459c7c601ff6f32094176616c616e6368659000
        => e0df000000
        <= 9000
      `),
    );

    const expectedResult = [
      {
        blocks: 169,
        flags: 51200,
        hash: "36a6b759373ec2a02c27883887170dfe4a2cf13f96ded7d661ef0fb708f435c0",
        hash_code_data: "ca7997e619639b55841fc17802ff0e88073206953ccedac2860a024079e68942",
        name: "Lido",
      },
      {
        blocks: 2289,
        flags: 49744,
        hash: "36416e9c8cc55d50213d5bb8f28c33806ec751a497692499431650c0932ccde1",
        hash_code_data: "08b76cb91b2c9f06d4036b83225ca03dafe922968497f68cb448d134092e46d0",
        name: "Exchange",
      },
      {
        blocks: 2569,
        flags: 51776,
        hash: "0863d9aec4e2972246ec6d5ab15ab0da9d66d7e3be0a256499b224ca7d4b6748",
        hash_code_data: "4646ed6a3999d47347136031ec66e6d391c6b58e62d28713c48893f6a56b583b",
        name: "XRP",
      },
      {
        blocks: 5291,
        flags: 51776,
        hash: "278a1ee8477fa97764f535be158676e468410ad6e12649bc017040906f5d58fa",
        hash_code_data: "34da55bc1d6ae3ff31d07f7d16850bc70bead8f9454cfcbec33215b1a95ff1a1",
        name: "Ethereum",
      },
      {
        blocks: 3495,
        flags: 51712,
        hash: "5c9b102ee3a64ff75bef54902b38951c87fff03ceb79bddb17da3cb4c7f3b2d3",
        hash_code_data: "9f838b6d044cb86ecd6d4934db1d4cdf2e51df62f4d2e60dafd1f7597355d33e",
        name: "NEAR",
      },
      {
        blocks: 3581,
        flags: 51792,
        hash: "cf33fb31b401fda1ad440f0a2babb1ac5a833a3ddd06a5a09481300316f6b07b",
        hash_code_data: "5a8389806255e4025206a00d1a60d816973c3eca7fcee0d4a412b200b7e70f75",
        name: "Bitcoin",
      },
      {
        blocks: 2741,
        flags: 51712,
        hash: "4768f66d1b1163fee7d5e4560829d1e0858c4f9a66f1a49c6524d8424b5a3839",
        hash_code_data: "d5ff36dd1cc55f86ff352575c4f8cf4715f5ada3412882ea92bb8170d119394a",
        name: "TON",
      },
      {
        blocks: 3701,
        flags: 51712,
        hash: "851ed223af8854a8344cf97e4b19361af2a833561cf8801842afa6e9fcbbf338",
        hash_code_data: "640a553cf9c2c065b123f9af3934060d3f96e1de7b6118d58597144b3d29988c",
        name: "Cosmos",
      },
      {
        blocks: 3129,
        flags: 51712,
        hash: "08e84ce6dcf7bffee53dcc1afd15401f90d97d19ea6780fb310ef79475c65457",
        hash_code_data: "4210cfef57e499e802584b8dd537fb39cac138f3a62324f7033de15f118d19d2",
        name: "Solana",
      },
      {
        blocks: 6821,
        flags: 49664,
        hash: "d505d9fc1a170320f13b252cfc508dd44a7cc84133da97a62459c7c601ff6f32",
        hash_code_data: "e202a028b1cbc6942b8b6b021e71d9ba416b0f30fc74773f24ba6ede1db90ab0",
        name: "Avalanche",
      },
    ];

    // When
    const result = await listApps(mockTransport);

    // Then
    expect(result).toEqual(expectedResult);
  });
});
