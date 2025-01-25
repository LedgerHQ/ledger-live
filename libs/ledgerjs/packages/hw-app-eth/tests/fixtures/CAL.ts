export const v1 = {
  "5:0xcccccccccccccccccccccccccccccccccccccccc:1fd77fb96a82b9c1de173fa836e20da791158ea832a3d07c6725f47c":
    {
      contractName: {
        label: "Anakin",
        signature:
          "30440220014ab9506fa7ea26d6f695ea2ce2cd3742852c54ce1793cfd1ca462aabd93d39022033e3b7d399cec2eaabc0e9f595f20dea2182fe9915a0fcde266de068a788a149",
      },
      fields: [
        {
          label: "From",
          path: "from.name",
          signature:
            "304402204184ab24eef5044a949d9dd4ab32daa7707633f40025c9ac93501b54a533742b0220125da8ac33437eadcc3128ae41190c2fd62e01921bfd4fc8821dd52ebe1cbf2e",
        },
        {
          label: "To",
          path: "to.name",
          signature:
            "3044022057d81ea65f2a51d88cfee2f567fc8eb4d416cc2036a0473342c082ef1b36a225022026ffe715e5e8e6b1da399a5197ef8bb77a64bf7ff93849a01c160d0ef928106e",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:5b2c066ad15a55058a74d5698b12785338559cb982cab547e5d93e3d":
    {
      contractName: {
        label: "Chewie",
        signature:
          "30440220695783f5cdb6f7df8c12af70dce746d72eea3e8db2aa4da6883f3ecd0e18114f022069b9a8f51bb2369b950702b29f31594dfe24a1c7aa5471f0f682a7f63cefaef4",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "30440220415f936aa7869609af6bf29f03a6af995657fda1d53465b9b301c484bcdf80790220732c4c0dde743d51bef4a1a3289729aa178e6e2ee336826b2dc26b794d6eebef",
        },
        {
          label: "Recipients",
          path: "to.[].wallets.[]",
          signature:
            "3045022100e220a1b0ffad989dcd4f11ce8ba49438d7685e04d512f447a9ba3f9b28caff3202202bcefa78626d00332f6586affe06fcba38d76fe643d1035f5d7ef2184f0307b0",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "304402201a75a81563b580604c43bc51e004f41ec9f45dad9daac80de760bc641e475cfd02200b284e2ce760c24b14709f03630efdc86826d606511820cf15baf56be601b587",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:a6dfffb1ad68d66636f07152a977b48093ca6f0761283b54d3699419":
    {
      contractName: {
        label: "Padme",
        signature:
          "3045022100bd6de7636bb63affd2a0e89dae3f7bc89a7f597abf57b8500713a98bdb8b71b0022067651fab5182a96804b8b072804daba643f3485e28662c34be21e566b6208150",
      },
      fields: [
        {
          label: "Value ma man",
          path: "val",
          signature:
            "30440220056eed97085e204cbb98ee6550e6dd4601bdbb488715e7a4c467a01516743f8502204d3ce91c60ec345036fd5c61dbfcd3b0cddec5aa9d303e98add16f94f84a2bcc",
        },
      ],
    },
  "1:0xcccccccccccccccccccccccccccccccccccccccc:7e916a5dd34dd8da7436fa22a4b79f250d77275e11273b38cdf5387c":
    {
      contractName: {
        label: "Darth Vador",
        signature:
          "3045022100e07b22754b0a822a1985c9a3435aff753beffb5adf4157356c4f8b35a57fd7d402200a87c7c4ccaeab7b32b5569012dcf166c027382155f5f4f6cb347762294351a2",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "3045022100de57b2e02bf337b5892d9a2c088ca4155538c81f439e372966b962c6c93492ad022046fdde6973a3d7ea4d5d431aed73b420fccbba1bf687fd6864039591a453625a",
        },
        {
          label: "Recipient",
          path: "to.members.[].name",
          signature:
            "3045022100e417d5ad99d507a14e48077f4210bd217f5dbd25afdb14d318cd9f4e3c68789f02203dcff6332826d34aeb1dfb2e064dc8eee803b34de47175403ae7ba5f936315f2",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "304402206393b2dd0bed33d4e9e19b6f1089c1ca269df6746df9bdc04d0d1e05239ae281022003177fd79ce85556a3b900a35dadae29bb9212eaa64c90428698e49be3695e86",
        },
        {
          label: "Attachment",
          path: "attach.list.[].name",
          signature:
            "3045022100e7e1454fb07ff84e8d768597e6ff7c01191d58e18ea6a691b5019fa24f9cc41c0220499ac0405908d84d97ce6615185c32b06505243ddf703f02db08dff177d4c3e0",
        },
      ],
    },
  "0:0x0000000000000000000000000000000000000000:1b035bb23481b565164f6266cddba7d0a1de7819b7867218761e8a7d":
    {
      contractName: {
        label: "Palpatine",
        signature:
          "304502210091f9ebbc812a20f1a575f64ade029f49e0442f6a88def31c7cf74a9ad7d9fd40022012e210516f01c8e12bc1a73c84b3511f663b0e48d7bf1b533f14e90db2725aec",
      },
      fields: [
        {
          label: "Timestamp",
          path: "curDate",
          signature:
            "3044022079158841df478fe788b50fe38ea80bac2903f862734b07285f69a92278ece9f9022065fe071875c34897f3c896e278c64eda264b72fac95937400bd40499491f52e3",
        },
        {
          label: "Identifier",
          path: "id",
          signature:
            "304402201f96f470b926b453cdb43bd6638807ab0e2691f639f68ea3caf7e84810fe7219022057feae8e954a40e86db68c68324ab3fed7e69c098ff5835da543c23297228acc",
        },
      ],
    },
  "1:0xcccccccccccccccccccccccccccccccccccccccc:8768c8db478d5e96fe52edadcd32dc5d182e48a9b51b4f166696f334":
    {
      contractName: {
        label: "Dark Maul",
        signature:
          "3045022100daffe0f32905a3d5951c475f50a1d49c97c168e39582894a5a44c3b24739f3d60220478f167f2cfa44e8b36050715f918343f0dd514e264adde70d6122aa6ba75ecc",
      },
      fields: [
        {
          label: "Negative 256",
          path: "neg256",
          signature:
            "30450221008a61ebf1d0e41ea583fc3520249a223b6028a6aaa7f4715b5f6ed64305eed887022041718d2e529976df0d00f4ae1ece50901c9865caf26426af0337f99785079aaa",
        },
        {
          label: "Positive 256",
          path: "pos256",
          signature:
            "3044022021afa673b6653a2f5723201f7831698165d6c8b4817f4082cd5592a1649769ce022006988f97bbbbd647d67a200a28fa1e570cf6f0d51d87bf4e9223f81aca9052f8",
        },
        {
          label: "Negative 128",
          path: "neg128",
          signature:
            "3044022012df54253d5b4146ecaa3f6f15828e90091c9eef3ed76942b47eafc2b164eb1302207907191856b58ed69c703219ec4c1141bf598605737d8555a8abafabf7aba5cf",
        },
        {
          label: "Positive 128",
          path: "pos128",
          signature:
            "304402203793e717c4eb6f4590ee94c0ed3d7d9d0d4c352e98485199cbe884cf1fa2dc8c022052fce5794e965db53493b20349bdc1b5f00963ced271666e9106a588201cad44",
        },
        {
          label: "Negative 64",
          path: "neg64",
          signature:
            "304402200c77f00b91d2af7b20f5785bf6b80880b3329abf59ecbc31ec539feb20bb21c302203e8a7b96e86fb95605956006943fdf95733da70fe107b8efb3330e409ce968bf",
        },
        {
          label: "Positive 64",
          path: "pos64",
          signature:
            "3045022100eca15cfe664e675898cb75ad5d6119a5dbc2db7bccd51b510b4d1362e47a1e310220787bc9e8a8545340d0c411edba3cedeee1969057c6ca5c10551ad0ac3d2ce697",
        },
        {
          label: "Negative 32",
          path: "neg32",
          signature:
            "304402204c1de916521b4e3041cefbd787ea7c17d73e4f7d7b997440c1cf0aa7256c35c70220231937d691154f9f9d1c94d6d9b11565d4d4c4a0cda652405429904c6aaa05cb",
        },
        {
          label: "Positive 32",
          path: "pos32",
          signature:
            "3045022100da5034823340f1588a816ba514e03b5d0af03f0d78eda8fdc7a8214e0e271efb02200b6bc4a650fde5fb7794bc048ef7e391bb2e182cc17d9b53cd294583cd283d98",
        },
        {
          label: "Negative 16",
          path: "neg16",
          signature:
            "30440220099a84a2f9fc7181f4597842b93db7ec8e4090a3b62dbda8facd9eab06d0e9ae02202c83bf02d4ef497d97e843b12caaac9cb755d16e61b690dbe55d0ca4e04e8cf5",
        },
        {
          label: "Positive 16",
          path: "pos16",
          signature:
            "3044022043b00eeecf90639640fbf8f1a26bfefea6161cc8fb5481205203149eccff7554022012742ff0240b45dafe01db746159185e66eecfd9c8271ac19c1cc2c3f899d0c9",
        },
        {
          label: "Negative 8",
          path: "neg8",
          signature:
            "3045022100e1e3d137c59ea844d91cd4e6db4c884a63dbb361b887601c7889be951223c7e30220096a8c6722a5e5b6d67be6a8c409b661017927beefc29130b218e86880253248",
        },
        {
          label: "Positive 8",
          path: "pos8",
          signature:
            "304402202544e902c2d379b67582f9ba5abaa196c18d6656c61da0c4dfe07963dcad16850220312bcc15c52b87903a706bb6970cdc4693f4132abcf79f8c00e1ca1e8e8b495a",
        },
      ],
    },
  "1:0x7f268357a8c2552623316e2562d90e642bb538e5:d8e4f2bd77f7562e99ea5df4adb127291a2bfbc225ae55450038f27f":
    {
      contractName: {
        label: "Mace Windu",
        signature:
          "3044022073cc8d51f50a641c5f649816afe149d68b4fe1991184d589bc11512b83fd0e6c0220520a66870d5a2965ffbbae7bf834ea2d66a45ebd92b28b44b675ed0538507b75",
      },
      fields: [
        {
          label: "Maker",
          path: "maker",
          signature:
            "3044022045440d9956eab04674470ecf319d5957997088afccad4ac24f4c2938f4527d10022051273e6710f1487fc02c178c8705817432994b87b1557d036f8df156443a6c10",
        },
        {
          label: "Taker",
          path: "taker",
          signature:
            "3045022100edb53ae572766258aafd3c1b2fd646a188b675ed6d7c2e91d4f30196074fc9300220521129fc3b4d7ff6a4a862a7e3b12c936da8e2f2d62eaf058d56738ded66bde2",
        },
        {
          label: "Base Price",
          path: "basePrice",
          signature:
            "3045022100909a48f16e71b423a7e7109d8fc513a8a3b6cc038e103aa957f081a4cb39c137022002c7792cbeaacffad1376f5cc0463c2e2f3c28fbf349ba22e5ae4abeb281b1ad",
        },
        {
          label: "Expiration Time",
          path: "expirationTime",
          signature:
            "3045022100963ea1d26292e612d6e1657d3613efceb4287e121ce86c9e9430f7ad98adc19f02206507c40721500c3a5b15aa342767c3e01708b37feab8b3283c61ce951902d31d",
        },
      ],
    },
  "1284:0xcccccccccccccccccccccccccccccccccccccccc:087da43b1d5a46a4acfe9437df4197f443a524ec658fbd0e8d305798":
    {
      contractName: {
        label: "Yoda",
        signature:
          "304502210082879b74f069c55b3785dad1667203fc35a4265f30d02b0f73643abb6b9bc0d002203c538793004a4adecde735f9397887ac7ea1ac22e04d8e5d29ebf7b438ce31a2",
      },
      fields: [
        {
          label: "Sender",
          path: "from",
          signature:
            "304402207521eb52ad759e37117db390d1b71838dbdcc9191b28c7030a5dcc44321e075b02207266ddebda9ed2b254dafff991c6b016956265b1672df98db2085c52b49cffd2",
        },
        {
          label: "Recipients",
          path: "to.[]",
          signature:
            "3045022100d55e2a2ac4cf2f0c0fc9ef822b69176e22b7c8bc7c9fc2ea417ea84e1c164c3902204ceffd11ba5979d767b9ded852705ec41e3133e3d95a7188e9039b038288509c",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "3045022100eec10ea4eb0846466871a8d256dde530b17b404fe7722736282c425e964762a702205f60d8e7760c16a8502caeec97ac17b224353cdaac115d09aa5e071917ea43c2",
        },
        {
          label: "Hello this is ID",
          path: "id",
          signature:
            "3045022100c57245b7832fb5cbae86bd35b3dd4c9f93a88b903285bc18f0db67a7133a29990220500b475c779985dd222b64cd76f93d6e08aefc21f356d29762c5b31da281ee93",
        },
      ],
    },
  "1:0x9757f2d2b135150bbeb65308d4a91804107cd8d6:139c059f886c2b9b41f05a6c4ec2578a048d18aaadbc095609e5df4b":
    {
      contractName: {
        label: "Boba",
        signature:
          "3045022100ff890837754849bac57d6109f2dcc05a6222417501e7dea899865af11a12f0ca02204dac269e4c9e4c4496c5bcc958477dd808a30a29aa87382a3d130545574a3f87",
      },
      fields: [
        {
          label: "Maker",
          path: "maker",
          signature:
            "304402201c4ce72a81bf1808ba5b0c797eccfbb625d673f817c73c0532cc57863c94447302205321f3c48855d22caf3e81c5de27d87a5175369fdaa3940054d3e33b73bb60ea",
        },
        {
          label: "Taker",
          path: "taker",
          signature:
            "3044022100ff48fa8b4c0269b9029d758e6af195a3e9891938fb49bc9a702bd7b0afb98ba0021f5249c69cc859839101abdee4a173c85606a1c2a0a0c63ebdfc8619a1f51328",
        },
      ],
    },
  "0:0x0000000000000000000000000000000000000000:e30e691e8ad018c90b84c64217c2e4abfe9881d27bcd0f8dd999f6b4":
    {
      contractName: {
        label: "R2D2",
        signature:
          "3045022100ab5dc977a4b06ad45aa15497fe6dbde7104392c4cb8cec5204cd7f0fdc12adff022072b90de52f617c88b2d31cc31ff7a944997e9d626727f4ebaff73e5b19f8217d",
      },
      fields: [
        {
          label: "Document",
          path: "document.[].[]",
          signature:
            "30440220048c28c88191b962fbd365e6545490a3ced9d48b3bc4703ba99b2ffeffa2584202200847b0e3636d8ed2d2966f8e87e76f7b29c4a5705f34caa3723012d92c29d249",
        },
        {
          label: "Proof",
          path: "proof.[].[]",
          signature:
            "30450221009107ff404875b9ae10e71898c72cbd9d0a377226400837dcd01f46ef03ca33c202207cdbbfdd440c2abebed092ffdbee847aafcd54279e7e889a372a6ea1517220ef",
        },
        {
          label: "Depth",
          path: "depthy.[].[].[].[]",
          signature:
            "3045022100a8957fb0acabb7b011250321403ca4cab82c03cc321aff2f9935e89b7ba6934402202ad7e3225f3f4a9099abef2af765949cbdef744cc912917e5978dc486cd3ee85",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:7e916a5dd34dd8da7436fa22a4b79f250d77275e11273b38cdf5387c":
    {
      contractName: {
        label: "C3P0",
        signature:
          "304402204a84b6192451644adf47eac6c022a92a4eb0fe33849a8db84d9979f35a3261470220704a2da9a4e9f5f438fec1aaf328a94ce0962c5bb2b2cbf7ce5a85af0552968a",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "3044022061102a17459e3eb33ea99f875a6e1a0bf32059752e858b8a714080c667d8adcb02204ed10e590bf7a29a417ca56b9484fc14d0a7c4f0d86e7ce24fb5ccf0556633c1",
        },
        {
          label: "Recipient",
          path: "to.members.[].name",
          signature:
            "3045022100da0d2991bb43f2f15750c506fe6de293403ac8554abba91a42a17b9bd606d28a022000eb1dc52e27f1787ad7974dc2c46b8d3e2b6a21a7d29b59dae6cd5950dd3ad7",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "3045022100b8eb78af1926c0f467a9eaae8bddfc9809142457b274e569c47ba67ea6e3670302204849783769cfd8db7881dc218cbd6ce68065daa7c91a86dac801450d794b4f27",
        },
        {
          label: "Attachment",
          path: "attach.list.[].name",
          signature:
            "3045022100b01fb7a24c68490b628a2733399d50325ef77fcd23937c47b621b2d081fbf29f02204194a21dc935f873172928cdd13e30cbdef28c08f1bae37b51d78355b0df5561",
        },
      ],
    },
  "5:0xccccccccccccccccccccccccccccccccccccccc1:5b2c066ad15a55058a74d5698b12785338559cb982cab547e5d93e3d":
    {
      contractName: {
        label: "Leia",
        signature:
          "304402206aade75a0906c6c6f47080a195d32bcc9d2ca44d9e1fe7c936a8f2040f10722a0220378e54fc0b9b6cccab50bd3c43cf0ed034ffbaba834dd18246289b26fe8ebb3e",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "304402205d72013185f9324c724f1456214818daa52778282f39f9511a197bef9266e91002205564bcfeb4bfbb13596e2c4cf86a602b01e8cea41abb6bb36fc5276142bb7844",
        },
        {
          label: "Should be Alice & Bob",
          path: "to.[].name",
          signature:
            "3044022024e948f1f8206bea3eee90636526d33565df61271fa2c2acebd9d5f5778fa42002206a2d68bb87a13008bcc735de5a238b67e6d2b7df91236bc50f8eb6cd58749193",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "30450221009e6d3ceb72239082bb60202a3b095bb308f41d8a6b63360c487b8798e1dd2d24022006ef5ddfffaa1acd0911c64ae7a00adad98ab82a57d6d010906df496511213a6",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:3863b554dca8a87c0367c3967cf1726802cdb6b7d4d1788301d35398":
    {
      contractName: {
        label: "Han",
        signature:
          "304402207ea368d6351bf9718c16f588592cac7f62c291aa944883788135165ee8c3490b02204039f684a10f75c474fb1be52a28cff3e1c2cbe82873179c6bc34c2b256d7ca3",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "304402206ace512db580330cba97a8519e888ac75968a88868bb76956bf23aac2c40d4d902202f8b91e8733799d2dce389a34b67d1e95f55d1d69c760a4ff6fdc98441648d70",
        },
        {
          label: "Recipients",
          path: "to.[].wallets.[]",
          signature:
            "3045022100a35791e52689caef688b4c11da7472d94460f714076c796cf210d5319bc232d60220692feb421e1dcb694ca03ce6f783d2403c24c25a63720cdcdf8786f7848bc579",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "3045022100d6095472a275cf338b4d83b5c7c50da3ef60f482c665b14be25c16fe4e04dc1a02204a5371fe846ba16360ff55ddb85cf2bb79b9db305c863d4a06e168e766ee13de",
        },
      ],
    },
  "0:0x0000000000000000000000000000000000000000:cf5a5f8e4ae5baff4e1dd4d767b839464ba1bc26c84228d89955de54":
    {
      contractName: {
        label: "Warrick",
        signature:
          "3045022100f1af490dc8b60d080fe2488ea720f2d305d60fcce71bf73609d432be64cbfc0f022046e68ffa02041b8677f73a922d2a077831195ab2067a37dcc2219e5e991efb14",
      },
      fields: [
        {
          label: "New Threshold",
          path: "newThreshold",
          signature:
            "3044022026d6cdb4b241594798d40203d787eb948f6513f665178de17a6044b8e4b084d30220575dab77928807a6b80a0d0e72b45c33e501a4d2e5c999fb33c4a2ac670f9e5c",
        },
      ],
    },
  "1:0xcccccccccccccccccccccccccccccccccccccccc:0270aaaa8983a8ba018832814fadeb88ea930d63b4cc7acfa241cbff":
    {
      contractName: {
        label: "Dark Maul",
        signature:
          "3045022100d9f6612aa98300474292182491148326e8e377b5584ca47f8f766b974bfce124022068409e7ef96e2312694e081449ae703a9b26bdd3eec2332f18156a5326a7b9f2",
      },
      fields: [
        {
          label: "Max UInt256",
          path: "max",
          signature:
            "304402202338f93fac8fe95ce7fac892fffe6e99d5ed3453b82429893bbddf68cede1abc0220712eec364c5e73cf81474530dea84835e639f5c58cdfef27fc7a42e5c09f6414",
        },
        {
          label: "Min Int256",
          path: "neg256",
          signature:
            "3045022100b4a931fcfab181c760817ec86262336033c9d296f8f68aed04766fd8e7a506c8022014abf7617ec659497c75914a3e6ee13c7356c625ad7e3e641a7187fed8fe5502",
        },
        {
          label: "Max Int256",
          path: "pos256",
          signature:
            "3045022100de1ea9d3db73089a8e9885b94652ff0a84fee2991352ed6711be82a410593aaf02202f04c7654037225fba8b8bbcb2d4becc091a6b36eb1fa373d6b7844c24d40787",
        },
        {
          label: "Min Int128",
          path: "neg128",
          signature:
            "3044022035616f2cf0eaac3a0d075ba69a85362b9f7348c051904466a4bf65f88a6d36d502200c9c5736f4800bae51890d7721fe534d798472f61f839a7b585854ca403a4b1c",
        },
        {
          label: "Max Int128",
          path: "pos128",
          signature:
            "3045022100fac114b732aa682525ca014b2e8cb36a23ea882c55a7173c4fbf2657cfeb094702203a1fb3460878c5a775977555718fb9d16a3b972a441fee23a000a90a0b81fea2",
        },
        {
          label: "Min Int64",
          path: "neg64",
          signature:
            "304402203771ba95ab8b4f673b31c0ad63495f40acb95df743707ccdda32a7fa32ec59d30220340e906465992877840a4e179c41cfaa78f352767c9acae55eb585eab99de28b",
        },
        {
          label: "Max Int64",
          path: "pos64",
          signature:
            "3044022068c50782a96e92e85e8027a892383395c183c797a410da981a89f761ceed16f702207ce1ab44a6125f0f1d16f94ae5165af5c7064e4cbe094fd830cebba2af7d1eba",
        },
        {
          label: "Min Int32",
          path: "neg32",
          signature:
            "304402202dbe56656795e5a3732186851ad56675d46c053233610f3dbfbdd1287d9f7dbc022066a396e10450912d03911dc54e4479f85c7447acd98719a7ad5e1b5ec006d0bb",
        },
        {
          label: "Max Int32",
          path: "pos32",
          signature:
            "304402200c3f65b45e88fd78d45a66ac4a7db9837eb9c8f1d7165e6c48623291218f7373022049f6c49c7bac26b82de50392f0354380da7c9aeb26660fd34227415374f9cd85",
        },
        {
          label: "Min Int16",
          path: "neg16",
          signature:
            "30440220304c255c31b96173db32434550e2c9e580f2e66036cbdba6352a2c0f02dc92ec02200d752473b881502c6c024ccdfb7523072da676a15f77c19729305eebb0001321",
        },
        {
          label: "Max Int16",
          path: "pos16",
          signature:
            "3044022019d155f12a3d4e4bf463954227c4978fad9bfa4c36c2b28eca459133d0c40136022028e6c4f0f223f9a74c15d3fb98baffa10aa2aec850ed42813301cbfb751ffbe0",
        },
        {
          label: "Min Int8",
          path: "neg8",
          signature:
            "304402204cd508c120bba2708c00c947711b106944e014d3322b6d018fca849219ff641f0220296c4c72b1a9d6f40f1c4c768d3dae3c4dd49d3b3dae95b64561f33d48793246",
        },
        {
          label: "Max Int8",
          path: "pos8",
          signature:
            "30440220606bab0c711597bc314b28b1395b88cf4008f686d4a52f743485837e61f2adf602203f5f452a06ef1a3acf66542473745165a7a9e6310db827038d02a23a50c84bdf",
        },
      ],
    },
  "1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48:d4dd8410bdcf861c48d353f8e3a9b738282a0fd9ba7239f59baa9099":
    {
      contractName: {
        label: "Permit USDC transfers",
        signature:
          "3045022100a79de252776cf2fe2758823fb523414e483420c9645466dd18189bd05376c527022076222d6e261689e5b25214562a75cd173dba49b20b923084dcd60ced2b0719ff",
      },
      fields: [
        {
          label: "From",
          path: "owner",
          signature:
            "30440220785a896fb5465f02c9e5dfb3d94e4d9455e2beb788be5ab7f6cdb7f30f2c6bd8022017ee7bf88e02635841692eac82e40cb1642264e83af05bdf490eeed3c9e7c8d7",
        },
        {
          label: "Approve to spender",
          path: "spender",
          signature:
            "3045022100cd3d674ab32ea5ce0755a0447df2d4216367e4a53b9132743e3c5a34a79240920220363230a8e765d42c7b60ff265297f865e7548fe34afc5a03294800a54ca885f1",
        },
        {
          label: "Amount allowance",
          path: "value",
          signature:
            "3045022100e9bbc349b93502ffbdd714179d909d14a43c9c97e44017628be3cf0c6699d4710220064d25e9b636307ef43a2b89c9732e2646ba9dbebed68b13b7dabe244426fe42",
        },
        {
          label: "Approval expire",
          path: "deadline",
          signature:
            "3045022100c37a7e1e4d7a45544728dea6410ed07297e74840afba73f7c0802d9a7e46d243022064c0d57ff2e4815769800b361d6657f697dc0f9ec19f4a6f40e9f20221841d8a",
        },
      ],
    },
  "137:0x000000000022d473030f116ddee9f6b43ac78ba3:4d593149e876e739220f3b5ede1b38a0213d76c4705b1547c4323df3":
    {
      contractName: {
        label: "Permit2",
        signature:
          "304402207b4555721d2144f142052d1f323429d542961573e0a0f3c5e87aa5aeded6b3f70220546903db2f0633c2f36c5398eedac02e71c18ab311f916ed9b28787552e49ca3",
      },
      fields: [
        {
          label: "Amount allowance",
          path: "details.token",
          signature:
            "3045022100a7c66fce7e291eb0e3d64a95a8794dd19a205c9b19d343920ecc06228cba6d4b022052b86d00e19e4f8ec8a71ced44baa5340a0c379e0b74dc5864d9395717a790a3",
        },
        {
          label: "Amount allowance",
          path: "details.amount",
          signature:
            "3045022100d0a303974f5821109b72fe89ed708014fa078a4814c492d81d85f70f9bd5410e02201e2a39a4982f9e1ddb2715e3f6c6c7c50842a10923609db54c3b2e098cb5bac1",
        },
        {
          label: "Approve to spender",
          path: "spender",
          signature:
            "3045022100a4f400735e562a75688eb30ff2535c73ba91505bc0b70004e3118ef186789918022030db9543fcf5bea2866649757de7f007a87e7e292780ec2a5d585b9b326c84fb",
        },
        {
          label: "Approval expire",
          path: "details.expiration",
          signature:
            "30450221008946ceda75026d2dac97cf4d1826e7e6333489839a3793d3d22c6b6638e5194902201acd183f3e178e23773707df03a43326d470b4d1aab732917d1409aeadb545a7",
        },
      ],
    },
  "1:0x000000000022d473030f116ddee9f6b43ac78ba3:a35a03a79619e46c3773d8880c952f7caeea45674557cfd2470e8fc5":
    {
      contractName: {
        label: "UniswapX Exclusive Dutch Order",
        signature:
          "30440220133222a33ac1797d287d213d9af3292534915e481edbc9002d4f1ec91452ad4902203223d57b5284dea9497286becc5aeef54760fb7a64b12019175f9df90f40c3fe",
      },
      fields: [
        {
          label: "Approve to spender",
          path: "spender",
          signature:
            "304402203a66cd6d84b6b24faeba9a5049dce8f43591e028214bd133de39f73c6fc5ce89022072a91ff94c52aaed99b6f09a98251b6a25a301755c961e8801a79a466129ee3f",
        },
        {
          label: "Amount allowance",
          path: "permitted.token",
          signature:
            "3044022056c647b6ff1a72a4aebddadf8a45e28a5884ac40fe45bd8ae79bc1e997dd89e3022066e77ae8105aba3ee9d9646c5743927f12585435a374f2f900196fb16bc36afa",
        },
        {
          label: "Amount allowance",
          path: "permitted.amount",
          signature:
            "3044022005f3b9faf97fc508487e4895560ffe234073b3513cd157d406f2207d511aec130220412b05e0cd35c9495520d3795ec476b0f4abc7cf0f9c8e721cb150fe5fd86d5d",
        },
        {
          label: "To swap",
          path: "witness.inputToken",
          signature:
            "3045022100c7996111dbcdce34c0e3f8c74f0b155308708c16ac60ca3b42961a4c07878f2a0220672111b4935ff21d3901414723fee7501c9923f164f2453ac95f60df97787bed",
        },
        {
          label: "To swap",
          path: "witness.inputStartAmount",
          signature:
            "304402203b5c7c7c71e2d342f76bdd652d55c73c61e1685773f621d25821e69ec0fbe6fd022059ae5049d1ed5a7be82585219e239a8adc3dfbbb57406ddf87ea919c409daf6c",
        },
        {
          label: "Tokens to receive",
          path: "witness.outputs.[].token",
          signature:
            "304402200518911aed49f8972b543fa71c3ccf0d3029800fff13ce27bb2981f19d3bdc4902200a7cb06951e60c69e4c7c41717687e47f2a1d49f04f82eb4bb19de2abc9d8ee8",
        },
        {
          label: "Minimum amounts to receive",
          path: "witness.outputs.[].endAmount",
          signature:
            "30440220095fc59a5c1b65fb19886025eff26d4627d574489a2d41e1050105c1579da4e102206c3f08ee24c44c87eb0e513c42ff65ba4875ae3603f7f5245b0aa5f85a8c6ac2",
        },
        {
          label: "On Addresses",
          path: "witness.outputs.[].recipient",
          signature:
            "3045022100f5787e5fc18bc219b57473e67254c174f39343a27ee990b19b23dc675cc2b4f30220161eea61a585d8669db6b82c707401e505e252e1927edae7c3f452d4bd4c5ca7",
        },
        {
          label: "Approval expire",
          path: "deadline",
          signature:
            "304402204404e9657ca1d7063fcdd08c35c4ae36acfacecf7f9ba0a1e77ff12118b2b1a4022071188357bd1aa16a3b78f77b56dd1fd5b395be876b8dd9e77fc12dfd5774c855",
        },
      ],
    },
  "137:0x111111125421ca6dc452d289314280a0f8842a65:c4d135e3a126166bdee4e4859b77383074c8f046fb9b83e9cef7138c":
    {
      contractName: {
        label: "1inch Order",
        signature:
          "304402206cfe6a9208d04c77b8791386f5fcbb70756bdcdde0a0c20e7339bf571fcffec1022060361f073a31b833dc2f4c4064e2a2bb060f52a58db0e966b2e87a02bf01ea50",
      },
      fields: [
        {
          label: "From",
          path: "maker",
          signature:
            "304402200b8b50b3b13c63d2cc6242ad5644dc5f20bc919f57e266293824d0f555a20ae202206626bf02d487f4496c7423760ce4ed0de810bc11ee207ceec8b66d6c2de7bf9d",
        },
        {
          label: "Send",
          path: "makerAsset",
          signature:
            "304402201e1dd801072f94f61704adaacb9ea01dd21458c9de339002225d172d2b5b9a3c0220778208c477b131762c2b9fca09bd1f0eb7ae584842315fa8d769ea68a483d3c9",
        },
        {
          label: "Send",
          path: "makingAmount",
          signature:
            "3044022071e175465cd3d6857aa51d30290891ac3a9e8593596173a659dcc1ab3c4654dd0220291d813961ed5b08e62e13fa7267b13337a85fd7eaf5667b6d7604dfe6b5207b",
        },
        {
          label: "Receive minimum",
          path: "takerAsset",
          signature:
            "3045022100ef1b0a3e910d423c86a5e73967d7d8825556c6a368e4b6cc33c8daf81e128925022054dd1af1b80e7eacbbab74ab07ab7ea8a4b7545349783da60ad60440e4669823",
        },
        {
          label: "Receive minimum",
          path: "takingAmount",
          signature:
            "30440220036abcafa7461d22947f975a4376b1662ae641a19f2764cd4096267ba7e41eea0220211f14028774e1ec57837c27d390c110d50ba3421a7fa7e5c17cc6b9d1dde726",
        },
        {
          label: "To",
          path: "receiver",
          signature:
            "3044022020eb170b9844e3c6c3b61d34887bb3a3acb4ea9f8ac01600927f8e83916020cf0220603cbbdf91a5488a63673343279030cc04c477ec6a558c10d4507c71b4da3881",
        },
      ],
    },
};

export const v2 = {
  "5:0xcccccccccccccccccccccccccccccccccccccccc:1fd77fb96a82b9c1de173fa836e20da791158ea832a3d07c6725f47c":
    {
      contractName: {
        label: "Anakin",
        signature:
          "30440220014ab9506fa7ea26d6f695ea2ce2cd3742852c54ce1793cfd1ca462aabd93d39022033e3b7d399cec2eaabc0e9f595f20dea2182fe9915a0fcde266de068a788a149",
      },
      fields: [
        {
          format: "raw",
          label: "From",
          path: "from.name",
          signature:
            "304402204184ab24eef5044a949d9dd4ab32daa7707633f40025c9ac93501b54a533742b0220125da8ac33437eadcc3128ae41190c2fd62e01921bfd4fc8821dd52ebe1cbf2e",
        },
        {
          format: "raw",
          label: "To",
          path: "to.name",
          signature:
            "3044022057d81ea65f2a51d88cfee2f567fc8eb4d416cc2036a0473342c082ef1b36a225022026ffe715e5e8e6b1da399a5197ef8bb77a64bf7ff93849a01c160d0ef928106e",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:5b2c066ad15a55058a74d5698b12785338559cb982cab547e5d93e3d":
    {
      contractName: {
        label: "Chewie",
        signature:
          "30440220695783f5cdb6f7df8c12af70dce746d72eea3e8db2aa4da6883f3ecd0e18114f022069b9a8f51bb2369b950702b29f31594dfe24a1c7aa5471f0f682a7f63cefaef4",
      },
      fields: [
        {
          format: "raw",
          label: "Sender",
          path: "from.name",
          signature:
            "30440220415f936aa7869609af6bf29f03a6af995657fda1d53465b9b301c484bcdf80790220732c4c0dde743d51bef4a1a3289729aa178e6e2ee336826b2dc26b794d6eebef",
        },
        {
          format: "raw",
          label: "Recipients",
          path: "to.[].wallets.[]",
          signature:
            "3045022100e220a1b0ffad989dcd4f11ce8ba49438d7685e04d512f447a9ba3f9b28caff3202202bcefa78626d00332f6586affe06fcba38d76fe643d1035f5d7ef2184f0307b0",
        },
        {
          format: "raw",
          label: "Message",
          path: "contents",
          signature:
            "304402201a75a81563b580604c43bc51e004f41ec9f45dad9daac80de760bc641e475cfd02200b284e2ce760c24b14709f03630efdc86826d606511820cf15baf56be601b587",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:a6dfffb1ad68d66636f07152a977b48093ca6f0761283b54d3699419":
    {
      contractName: {
        label: "Padme",
        signature:
          "3045022100bd6de7636bb63affd2a0e89dae3f7bc89a7f597abf57b8500713a98bdb8b71b0022067651fab5182a96804b8b072804daba643f3485e28662c34be21e566b6208150",
      },
      fields: [
        {
          format: "raw",
          label: "Value ma man",
          path: "val",
          signature:
            "30440220056eed97085e204cbb98ee6550e6dd4601bdbb488715e7a4c467a01516743f8502204d3ce91c60ec345036fd5c61dbfcd3b0cddec5aa9d303e98add16f94f84a2bcc",
        },
      ],
    },
  "1:0xcccccccccccccccccccccccccccccccccccccccc:7e916a5dd34dd8da7436fa22a4b79f250d77275e11273b38cdf5387c":
    {
      contractName: {
        label: "Darth Vador",
        signature:
          "3045022100e07b22754b0a822a1985c9a3435aff753beffb5adf4157356c4f8b35a57fd7d402200a87c7c4ccaeab7b32b5569012dcf166c027382155f5f4f6cb347762294351a2",
      },
      fields: [
        {
          format: "raw",
          label: "Sender",
          path: "from.name",
          signature:
            "3045022100de57b2e02bf337b5892d9a2c088ca4155538c81f439e372966b962c6c93492ad022046fdde6973a3d7ea4d5d431aed73b420fccbba1bf687fd6864039591a453625a",
        },
        {
          format: "raw",
          label: "Recipient",
          path: "to.members.[].name",
          signature:
            "3045022100e417d5ad99d507a14e48077f4210bd217f5dbd25afdb14d318cd9f4e3c68789f02203dcff6332826d34aeb1dfb2e064dc8eee803b34de47175403ae7ba5f936315f2",
        },
        {
          format: "raw",
          label: "Message",
          path: "contents",
          signature:
            "304402206393b2dd0bed33d4e9e19b6f1089c1ca269df6746df9bdc04d0d1e05239ae281022003177fd79ce85556a3b900a35dadae29bb9212eaa64c90428698e49be3695e86",
        },
        {
          format: "raw",
          label: "Attachment",
          path: "attach.list.[].name",
          signature:
            "3045022100e7e1454fb07ff84e8d768597e6ff7c01191d58e18ea6a691b5019fa24f9cc41c0220499ac0405908d84d97ce6615185c32b06505243ddf703f02db08dff177d4c3e0",
        },
      ],
    },
  "0:0x0000000000000000000000000000000000000000:1b035bb23481b565164f6266cddba7d0a1de7819b7867218761e8a7d":
    {
      contractName: {
        label: "Palpatine",
        signature:
          "304502210091f9ebbc812a20f1a575f64ade029f49e0442f6a88def31c7cf74a9ad7d9fd40022012e210516f01c8e12bc1a73c84b3511f663b0e48d7bf1b533f14e90db2725aec",
      },
      fields: [
        {
          format: "raw",
          label: "Timestamp",
          path: "curDate",
          signature:
            "3044022079158841df478fe788b50fe38ea80bac2903f862734b07285f69a92278ece9f9022065fe071875c34897f3c896e278c64eda264b72fac95937400bd40499491f52e3",
        },
        {
          format: "raw",
          label: "Identifier",
          path: "id",
          signature:
            "304402201f96f470b926b453cdb43bd6638807ab0e2691f639f68ea3caf7e84810fe7219022057feae8e954a40e86db68c68324ab3fed7e69c098ff5835da543c23297228acc",
        },
      ],
    },
  "1:0xcccccccccccccccccccccccccccccccccccccccc:8768c8db478d5e96fe52edadcd32dc5d182e48a9b51b4f166696f334":
    {
      contractName: {
        label: "Dark Maul",
        signature:
          "3045022100daffe0f32905a3d5951c475f50a1d49c97c168e39582894a5a44c3b24739f3d60220478f167f2cfa44e8b36050715f918343f0dd514e264adde70d6122aa6ba75ecc",
      },
      fields: [
        {
          format: "raw",
          label: "Negative 256",
          path: "neg256",
          signature:
            "30450221008a61ebf1d0e41ea583fc3520249a223b6028a6aaa7f4715b5f6ed64305eed887022041718d2e529976df0d00f4ae1ece50901c9865caf26426af0337f99785079aaa",
        },
        {
          format: "raw",
          label: "Positive 256",
          path: "pos256",
          signature:
            "3044022021afa673b6653a2f5723201f7831698165d6c8b4817f4082cd5592a1649769ce022006988f97bbbbd647d67a200a28fa1e570cf6f0d51d87bf4e9223f81aca9052f8",
        },
        {
          format: "raw",
          label: "Negative 128",
          path: "neg128",
          signature:
            "3044022012df54253d5b4146ecaa3f6f15828e90091c9eef3ed76942b47eafc2b164eb1302207907191856b58ed69c703219ec4c1141bf598605737d8555a8abafabf7aba5cf",
        },
        {
          format: "raw",
          label: "Positive 128",
          path: "pos128",
          signature:
            "304402203793e717c4eb6f4590ee94c0ed3d7d9d0d4c352e98485199cbe884cf1fa2dc8c022052fce5794e965db53493b20349bdc1b5f00963ced271666e9106a588201cad44",
        },
        {
          format: "raw",
          label: "Negative 64",
          path: "neg64",
          signature:
            "304402200c77f00b91d2af7b20f5785bf6b80880b3329abf59ecbc31ec539feb20bb21c302203e8a7b96e86fb95605956006943fdf95733da70fe107b8efb3330e409ce968bf",
        },
        {
          format: "raw",
          label: "Positive 64",
          path: "pos64",
          signature:
            "3045022100eca15cfe664e675898cb75ad5d6119a5dbc2db7bccd51b510b4d1362e47a1e310220787bc9e8a8545340d0c411edba3cedeee1969057c6ca5c10551ad0ac3d2ce697",
        },
        {
          format: "raw",
          label: "Negative 32",
          path: "neg32",
          signature:
            "304402204c1de916521b4e3041cefbd787ea7c17d73e4f7d7b997440c1cf0aa7256c35c70220231937d691154f9f9d1c94d6d9b11565d4d4c4a0cda652405429904c6aaa05cb",
        },
        {
          format: "raw",
          label: "Positive 32",
          path: "pos32",
          signature:
            "3045022100da5034823340f1588a816ba514e03b5d0af03f0d78eda8fdc7a8214e0e271efb02200b6bc4a650fde5fb7794bc048ef7e391bb2e182cc17d9b53cd294583cd283d98",
        },
        {
          format: "raw",
          label: "Negative 16",
          path: "neg16",
          signature:
            "30440220099a84a2f9fc7181f4597842b93db7ec8e4090a3b62dbda8facd9eab06d0e9ae02202c83bf02d4ef497d97e843b12caaac9cb755d16e61b690dbe55d0ca4e04e8cf5",
        },
        {
          format: "raw",
          label: "Positive 16",
          path: "pos16",
          signature:
            "3044022043b00eeecf90639640fbf8f1a26bfefea6161cc8fb5481205203149eccff7554022012742ff0240b45dafe01db746159185e66eecfd9c8271ac19c1cc2c3f899d0c9",
        },
        {
          format: "raw",
          label: "Negative 8",
          path: "neg8",
          signature:
            "3045022100e1e3d137c59ea844d91cd4e6db4c884a63dbb361b887601c7889be951223c7e30220096a8c6722a5e5b6d67be6a8c409b661017927beefc29130b218e86880253248",
        },
        {
          format: "raw",
          label: "Positive 8",
          path: "pos8",
          signature:
            "304402202544e902c2d379b67582f9ba5abaa196c18d6656c61da0c4dfe07963dcad16850220312bcc15c52b87903a706bb6970cdc4693f4132abcf79f8c00e1ca1e8e8b495a",
        },
      ],
    },
  "1:0x7f268357a8c2552623316e2562d90e642bb538e5:d8e4f2bd77f7562e99ea5df4adb127291a2bfbc225ae55450038f27f":
    {
      contractName: {
        label: "Mace Windu",
        signature:
          "3044022073cc8d51f50a641c5f649816afe149d68b4fe1991184d589bc11512b83fd0e6c0220520a66870d5a2965ffbbae7bf834ea2d66a45ebd92b28b44b675ed0538507b75",
      },
      fields: [
        {
          format: "raw",
          label: "Maker",
          path: "maker",
          signature:
            "3044022045440d9956eab04674470ecf319d5957997088afccad4ac24f4c2938f4527d10022051273e6710f1487fc02c178c8705817432994b87b1557d036f8df156443a6c10",
        },
        {
          format: "raw",
          label: "Taker",
          path: "taker",
          signature:
            "3045022100edb53ae572766258aafd3c1b2fd646a188b675ed6d7c2e91d4f30196074fc9300220521129fc3b4d7ff6a4a862a7e3b12c936da8e2f2d62eaf058d56738ded66bde2",
        },
        {
          format: "raw",
          label: "Base Price",
          path: "basePrice",
          signature:
            "3045022100909a48f16e71b423a7e7109d8fc513a8a3b6cc038e103aa957f081a4cb39c137022002c7792cbeaacffad1376f5cc0463c2e2f3c28fbf349ba22e5ae4abeb281b1ad",
        },
        {
          format: "raw",
          label: "Expiration Time",
          path: "expirationTime",
          signature:
            "3045022100963ea1d26292e612d6e1657d3613efceb4287e121ce86c9e9430f7ad98adc19f02206507c40721500c3a5b15aa342767c3e01708b37feab8b3283c61ce951902d31d",
        },
      ],
    },
  "1284:0xcccccccccccccccccccccccccccccccccccccccc:087da43b1d5a46a4acfe9437df4197f443a524ec658fbd0e8d305798":
    {
      contractName: {
        label: "Yoda",
        signature:
          "304502210082879b74f069c55b3785dad1667203fc35a4265f30d02b0f73643abb6b9bc0d002203c538793004a4adecde735f9397887ac7ea1ac22e04d8e5d29ebf7b438ce31a2",
      },
      fields: [
        {
          format: "raw",
          label: "Sender",
          path: "from",
          signature:
            "304402207521eb52ad759e37117db390d1b71838dbdcc9191b28c7030a5dcc44321e075b02207266ddebda9ed2b254dafff991c6b016956265b1672df98db2085c52b49cffd2",
        },
        {
          format: "raw",
          label: "Recipients",
          path: "to.[]",
          signature:
            "3045022100d55e2a2ac4cf2f0c0fc9ef822b69176e22b7c8bc7c9fc2ea417ea84e1c164c3902204ceffd11ba5979d767b9ded852705ec41e3133e3d95a7188e9039b038288509c",
        },
        {
          format: "raw",
          label: "Message",
          path: "contents",
          signature:
            "3045022100eec10ea4eb0846466871a8d256dde530b17b404fe7722736282c425e964762a702205f60d8e7760c16a8502caeec97ac17b224353cdaac115d09aa5e071917ea43c2",
        },
        {
          format: "raw",
          label: "Hello this is ID",
          path: "id",
          signature:
            "3045022100c57245b7832fb5cbae86bd35b3dd4c9f93a88b903285bc18f0db67a7133a29990220500b475c779985dd222b64cd76f93d6e08aefc21f356d29762c5b31da281ee93",
        },
      ],
    },
  "1:0x9757f2d2b135150bbeb65308d4a91804107cd8d6:139c059f886c2b9b41f05a6c4ec2578a048d18aaadbc095609e5df4b":
    {
      contractName: {
        label: "Boba",
        signature:
          "3045022100ff890837754849bac57d6109f2dcc05a6222417501e7dea899865af11a12f0ca02204dac269e4c9e4c4496c5bcc958477dd808a30a29aa87382a3d130545574a3f87",
      },
      fields: [
        {
          format: "raw",
          label: "Maker",
          path: "maker",
          signature:
            "304402201c4ce72a81bf1808ba5b0c797eccfbb625d673f817c73c0532cc57863c94447302205321f3c48855d22caf3e81c5de27d87a5175369fdaa3940054d3e33b73bb60ea",
        },
        {
          format: "raw",
          label: "Taker",
          path: "taker",
          signature:
            "3044022100ff48fa8b4c0269b9029d758e6af195a3e9891938fb49bc9a702bd7b0afb98ba0021f5249c69cc859839101abdee4a173c85606a1c2a0a0c63ebdfc8619a1f51328",
        },
      ],
    },
  "0:0x0000000000000000000000000000000000000000:e30e691e8ad018c90b84c64217c2e4abfe9881d27bcd0f8dd999f6b4":
    {
      contractName: {
        label: "R2D2",
        signature:
          "3045022100ab5dc977a4b06ad45aa15497fe6dbde7104392c4cb8cec5204cd7f0fdc12adff022072b90de52f617c88b2d31cc31ff7a944997e9d626727f4ebaff73e5b19f8217d",
      },
      fields: [
        {
          format: "raw",
          label: "Document",
          path: "document.[].[]",
          signature:
            "30440220048c28c88191b962fbd365e6545490a3ced9d48b3bc4703ba99b2ffeffa2584202200847b0e3636d8ed2d2966f8e87e76f7b29c4a5705f34caa3723012d92c29d249",
        },
        {
          format: "raw",
          label: "Proof",
          path: "proof.[].[]",
          signature:
            "30450221009107ff404875b9ae10e71898c72cbd9d0a377226400837dcd01f46ef03ca33c202207cdbbfdd440c2abebed092ffdbee847aafcd54279e7e889a372a6ea1517220ef",
        },
        {
          format: "raw",
          label: "Depth",
          path: "depthy.[].[].[].[]",
          signature:
            "3045022100a8957fb0acabb7b011250321403ca4cab82c03cc321aff2f9935e89b7ba6934402202ad7e3225f3f4a9099abef2af765949cbdef744cc912917e5978dc486cd3ee85",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:7e916a5dd34dd8da7436fa22a4b79f250d77275e11273b38cdf5387c":
    {
      contractName: {
        label: "C3P0",
        signature:
          "304402204a84b6192451644adf47eac6c022a92a4eb0fe33849a8db84d9979f35a3261470220704a2da9a4e9f5f438fec1aaf328a94ce0962c5bb2b2cbf7ce5a85af0552968a",
      },
      fields: [
        {
          format: "raw",
          label: "Sender",
          path: "from.name",
          signature:
            "3044022061102a17459e3eb33ea99f875a6e1a0bf32059752e858b8a714080c667d8adcb02204ed10e590bf7a29a417ca56b9484fc14d0a7c4f0d86e7ce24fb5ccf0556633c1",
        },
        {
          format: "raw",
          label: "Recipient",
          path: "to.members.[].name",
          signature:
            "3045022100da0d2991bb43f2f15750c506fe6de293403ac8554abba91a42a17b9bd606d28a022000eb1dc52e27f1787ad7974dc2c46b8d3e2b6a21a7d29b59dae6cd5950dd3ad7",
        },
        {
          format: "raw",
          label: "Message",
          path: "contents",
          signature:
            "3045022100b8eb78af1926c0f467a9eaae8bddfc9809142457b274e569c47ba67ea6e3670302204849783769cfd8db7881dc218cbd6ce68065daa7c91a86dac801450d794b4f27",
        },
        {
          format: "raw",
          label: "Attachment",
          path: "attach.list.[].name",
          signature:
            "3045022100b01fb7a24c68490b628a2733399d50325ef77fcd23937c47b621b2d081fbf29f02204194a21dc935f873172928cdd13e30cbdef28c08f1bae37b51d78355b0df5561",
        },
      ],
    },
  "5:0xccccccccccccccccccccccccccccccccccccccc1:5b2c066ad15a55058a74d5698b12785338559cb982cab547e5d93e3d":
    {
      contractName: {
        label: "Leia",
        signature:
          "304402206aade75a0906c6c6f47080a195d32bcc9d2ca44d9e1fe7c936a8f2040f10722a0220378e54fc0b9b6cccab50bd3c43cf0ed034ffbaba834dd18246289b26fe8ebb3e",
      },
      fields: [
        {
          format: "raw",
          label: "Sender",
          path: "from.name",
          signature:
            "304402205d72013185f9324c724f1456214818daa52778282f39f9511a197bef9266e91002205564bcfeb4bfbb13596e2c4cf86a602b01e8cea41abb6bb36fc5276142bb7844",
        },
        {
          format: "raw",
          label: "Should be Alice & Bob",
          path: "to.[].name",
          signature:
            "3044022024e948f1f8206bea3eee90636526d33565df61271fa2c2acebd9d5f5778fa42002206a2d68bb87a13008bcc735de5a238b67e6d2b7df91236bc50f8eb6cd58749193",
        },
        {
          format: "raw",
          label: "Message",
          path: "contents",
          signature:
            "30450221009e6d3ceb72239082bb60202a3b095bb308f41d8a6b63360c487b8798e1dd2d24022006ef5ddfffaa1acd0911c64ae7a00adad98ab82a57d6d010906df496511213a6",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:3863b554dca8a87c0367c3967cf1726802cdb6b7d4d1788301d35398":
    {
      contractName: {
        label: "Han",
        signature:
          "304402207ea368d6351bf9718c16f588592cac7f62c291aa944883788135165ee8c3490b02204039f684a10f75c474fb1be52a28cff3e1c2cbe82873179c6bc34c2b256d7ca3",
      },
      fields: [
        {
          format: "raw",
          label: "Sender",
          path: "from.name",
          signature:
            "304402206ace512db580330cba97a8519e888ac75968a88868bb76956bf23aac2c40d4d902202f8b91e8733799d2dce389a34b67d1e95f55d1d69c760a4ff6fdc98441648d70",
        },
        {
          format: "raw",
          label: "Recipients",
          path: "to.[].wallets.[]",
          signature:
            "3045022100a35791e52689caef688b4c11da7472d94460f714076c796cf210d5319bc232d60220692feb421e1dcb694ca03ce6f783d2403c24c25a63720cdcdf8786f7848bc579",
        },
        {
          format: "raw",
          label: "Message",
          path: "contents",
          signature:
            "3045022100d6095472a275cf338b4d83b5c7c50da3ef60f482c665b14be25c16fe4e04dc1a02204a5371fe846ba16360ff55ddb85cf2bb79b9db305c863d4a06e168e766ee13de",
        },
      ],
    },
  "0:0x0000000000000000000000000000000000000000:cf5a5f8e4ae5baff4e1dd4d767b839464ba1bc26c84228d89955de54":
    {
      contractName: {
        label: "Warrick",
        signature:
          "3045022100f1af490dc8b60d080fe2488ea720f2d305d60fcce71bf73609d432be64cbfc0f022046e68ffa02041b8677f73a922d2a077831195ab2067a37dcc2219e5e991efb14",
      },
      fields: [
        {
          format: "raw",
          label: "New Threshold",
          path: "newThreshold",
          signature:
            "3044022026d6cdb4b241594798d40203d787eb948f6513f665178de17a6044b8e4b084d30220575dab77928807a6b80a0d0e72b45c33e501a4d2e5c999fb33c4a2ac670f9e5c",
        },
      ],
    },
  "1:0xcccccccccccccccccccccccccccccccccccccccc:0270aaaa8983a8ba018832814fadeb88ea930d63b4cc7acfa241cbff":
    {
      contractName: {
        label: "Dark Maul",
        signature:
          "3045022100d9f6612aa98300474292182491148326e8e377b5584ca47f8f766b974bfce124022068409e7ef96e2312694e081449ae703a9b26bdd3eec2332f18156a5326a7b9f2",
      },
      fields: [
        {
          format: "raw",
          label: "Max UInt256",
          path: "max",
          signature:
            "304402202338f93fac8fe95ce7fac892fffe6e99d5ed3453b82429893bbddf68cede1abc0220712eec364c5e73cf81474530dea84835e639f5c58cdfef27fc7a42e5c09f6414",
        },
        {
          format: "raw",
          label: "Min Int256",
          path: "neg256",
          signature:
            "3045022100b4a931fcfab181c760817ec86262336033c9d296f8f68aed04766fd8e7a506c8022014abf7617ec659497c75914a3e6ee13c7356c625ad7e3e641a7187fed8fe5502",
        },
        {
          format: "raw",
          label: "Max Int256",
          path: "pos256",
          signature:
            "3045022100de1ea9d3db73089a8e9885b94652ff0a84fee2991352ed6711be82a410593aaf02202f04c7654037225fba8b8bbcb2d4becc091a6b36eb1fa373d6b7844c24d40787",
        },
        {
          format: "raw",
          label: "Min Int128",
          path: "neg128",
          signature:
            "3044022035616f2cf0eaac3a0d075ba69a85362b9f7348c051904466a4bf65f88a6d36d502200c9c5736f4800bae51890d7721fe534d798472f61f839a7b585854ca403a4b1c",
        },
        {
          format: "raw",
          label: "Max Int128",
          path: "pos128",
          signature:
            "3045022100fac114b732aa682525ca014b2e8cb36a23ea882c55a7173c4fbf2657cfeb094702203a1fb3460878c5a775977555718fb9d16a3b972a441fee23a000a90a0b81fea2",
        },
        {
          format: "raw",
          label: "Min Int64",
          path: "neg64",
          signature:
            "304402203771ba95ab8b4f673b31c0ad63495f40acb95df743707ccdda32a7fa32ec59d30220340e906465992877840a4e179c41cfaa78f352767c9acae55eb585eab99de28b",
        },
        {
          format: "raw",
          label: "Max Int64",
          path: "pos64",
          signature:
            "3044022068c50782a96e92e85e8027a892383395c183c797a410da981a89f761ceed16f702207ce1ab44a6125f0f1d16f94ae5165af5c7064e4cbe094fd830cebba2af7d1eba",
        },
        {
          format: "raw",
          label: "Min Int32",
          path: "neg32",
          signature:
            "304402202dbe56656795e5a3732186851ad56675d46c053233610f3dbfbdd1287d9f7dbc022066a396e10450912d03911dc54e4479f85c7447acd98719a7ad5e1b5ec006d0bb",
        },
        {
          format: "raw",
          label: "Max Int32",
          path: "pos32",
          signature:
            "304402200c3f65b45e88fd78d45a66ac4a7db9837eb9c8f1d7165e6c48623291218f7373022049f6c49c7bac26b82de50392f0354380da7c9aeb26660fd34227415374f9cd85",
        },
        {
          format: "raw",
          label: "Min Int16",
          path: "neg16",
          signature:
            "30440220304c255c31b96173db32434550e2c9e580f2e66036cbdba6352a2c0f02dc92ec02200d752473b881502c6c024ccdfb7523072da676a15f77c19729305eebb0001321",
        },
        {
          format: "raw",
          label: "Max Int16",
          path: "pos16",
          signature:
            "3044022019d155f12a3d4e4bf463954227c4978fad9bfa4c36c2b28eca459133d0c40136022028e6c4f0f223f9a74c15d3fb98baffa10aa2aec850ed42813301cbfb751ffbe0",
        },
        {
          format: "raw",
          label: "Min Int8",
          path: "neg8",
          signature:
            "304402204cd508c120bba2708c00c947711b106944e014d3322b6d018fca849219ff641f0220296c4c72b1a9d6f40f1c4c768d3dae3c4dd49d3b3dae95b64561f33d48793246",
        },
        {
          format: "raw",
          label: "Max Int8",
          path: "pos8",
          signature:
            "30440220606bab0c711597bc314b28b1395b88cf4008f686d4a52f743485837e61f2adf602203f5f452a06ef1a3acf66542473745165a7a9e6310db827038d02a23a50c84bdf",
        },
      ],
    },
  "1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48:d4dd8410bdcf861c48d353f8e3a9b738282a0fd9ba7239f59baa9099":
    {
      contractName: {
        label: "Permit USDC transfers",
        signature:
          "3045022100a79de252776cf2fe2758823fb523414e483420c9645466dd18189bd05376c527022076222d6e261689e5b25214562a75cd173dba49b20b923084dcd60ced2b0719ff",
      },
      fields: [
        {
          format: "raw",
          label: "From",
          path: "owner",
          signature:
            "30440220785a896fb5465f02c9e5dfb3d94e4d9455e2beb788be5ab7f6cdb7f30f2c6bd8022017ee7bf88e02635841692eac82e40cb1642264e83af05bdf490eeed3c9e7c8d7",
        },
        {
          format: "raw",
          label: "Approve to spender",
          path: "spender",
          signature:
            "3045022100cd3d674ab32ea5ce0755a0447df2d4216367e4a53b9132743e3c5a34a79240920220363230a8e765d42c7b60ff265297f865e7548fe34afc5a03294800a54ca885f1",
        },
        {
          coin_ref: 255,
          format: "amount",
          label: "Amount allowance",
          path: "value",
          signature:
            "3045022100ddb1f28019136896db0901806ded2a372500bb83c153dafdc28f214292cdda3802201b562d0a01a5c6dc905766b760231c71f7b53df0aaa2773e8c0c6da1a3176e61",
        },
        {
          format: "datetime",
          label: "Approval expire",
          path: "deadline",
          signature:
            "3045022100ca28b0acda246fbd00c79250a4c0146197b63f7695269b2fd053af71fa24313802203bdc4420daeb08f26a5a4177ae9e1e5307562e5d3dd410c5a147671f5cd9c63d",
        },
      ],
    },
  "137:0x000000000022d473030f116ddee9f6b43ac78ba3:4d593149e876e739220f3b5ede1b38a0213d76c4705b1547c4323df3":
    {
      contractName: {
        label: "Permit2",
        signature:
          "304402207b4555721d2144f142052d1f323429d542961573e0a0f3c5e87aa5aeded6b3f70220546903db2f0633c2f36c5398eedac02e71c18ab311f916ed9b28787552e49ca3",
      },
      fields: [
        {
          coin_ref: 0,
          format: "token",
          label: "Amount allowance",
          path: "details.token",
          signature:
            "3045022100f443a122573bc88adb3a774cfcf7c7772d9ab11ee8d04c1b4aaa1f169b63211c0220742d14ea921358e7777d9c53666a8661897c7a6f9405db347845073873be929c",
        },
        {
          coin_ref: 0,
          format: "amount",
          label: "Amount allowance",
          path: "details.amount",
          signature:
            "3045022100a25bcfd5a5a3df6d873874eeb417ff9fc451f3002aee73cee9b8b0bc1e8ef68d02201836220f0d030d953d44d9141b38c050517bc29967c31941c9bd7eb485d5e694",
        },
        {
          format: "raw",
          label: "Approve to spender",
          path: "spender",
          signature:
            "3045022100a4f400735e562a75688eb30ff2535c73ba91505bc0b70004e3118ef186789918022030db9543fcf5bea2866649757de7f007a87e7e292780ec2a5d585b9b326c84fb",
        },
        {
          format: "datetime",
          label: "Approval expire",
          path: "details.expiration",
          signature:
            "3045022100dfeb0c1b415264ad40024f0c11a9d9a491d252bb99a6a257ac9db36d4214e87402207d0a838e62ad6f8148b04849d7a2dc5c75491ac445371498a5971c8ec2b6d7ac",
        },
      ],
    },
  "1:0x000000000022d473030f116ddee9f6b43ac78ba3:a35a03a79619e46c3773d8880c952f7caeea45674557cfd2470e8fc5":
    {
      contractName: {
        label: "UniswapX Exclusive Dutch Order",
        signature:
          "30440220133222a33ac1797d287d213d9af3292534915e481edbc9002d4f1ec91452ad4902203223d57b5284dea9497286becc5aeef54760fb7a64b12019175f9df90f40c3fe",
      },
      fields: [
        {
          format: "raw",
          label: "Approve to spender",
          path: "spender",
          signature:
            "304402203a66cd6d84b6b24faeba9a5049dce8f43591e028214bd133de39f73c6fc5ce89022072a91ff94c52aaed99b6f09a98251b6a25a301755c961e8801a79a466129ee3f",
        },
        {
          coin_ref: 0,
          format: "token",
          label: "Amount allowance",
          path: "permitted.token",
          signature:
            "30440220087564cbfcaa383760331291b08e940b137d5ab7e6585fd21460ff8a2bc962a202202039dc9e8a9175ac7d397268f600e4cc34d8692548e893aba315a83eb6b3764f",
        },
        {
          coin_ref: 0,
          format: "amount",
          label: "Amount allowance",
          path: "permitted.amount",
          signature:
            "3045022100f81546f3be85c23f4f4583b225ee650cf183aa463236c43305a93090a2472ccd02201b6ff2a84877caee2f49a694ab8f3b163d055f28e0789496300fb01c7fda6157",
        },
        {
          coin_ref: 1,
          format: "token",
          label: "To swap",
          path: "witness.inputToken",
          signature:
            "3044022001b973eae56269f1973398aa53db8e2bba657d81bda9f772bd1103884fb63b950220073ca0844bf7d613b51a96e01a22f5b34f3a5fe4f45ed98d2c45314e5f2eea71",
        },
        {
          coin_ref: 1,
          format: "amount",
          label: "To swap",
          path: "witness.inputStartAmount",
          signature:
            "3045022100dfd4251280d6c2f5cedd28eecd270d6140a9642456c8de317d288493d478e87f02201cfd53b321b426eb0d28e879af1ce9dd59259b9f5bfe3d7e165efa7a5f200b88",
        },
        {
          format: "raw",
          label: "Tokens to receive",
          path: "witness.outputs.[].token",
          signature:
            "304402200518911aed49f8972b543fa71c3ccf0d3029800fff13ce27bb2981f19d3bdc4902200a7cb06951e60c69e4c7c41717687e47f2a1d49f04f82eb4bb19de2abc9d8ee8",
        },
        {
          format: "raw",
          label: "Minimum amounts to receive",
          path: "witness.outputs.[].endAmount",
          signature:
            "30440220095fc59a5c1b65fb19886025eff26d4627d574489a2d41e1050105c1579da4e102206c3f08ee24c44c87eb0e513c42ff65ba4875ae3603f7f5245b0aa5f85a8c6ac2",
        },
        {
          format: "raw",
          label: "On Addresses",
          path: "witness.outputs.[].recipient",
          signature:
            "3045022100f5787e5fc18bc219b57473e67254c174f39343a27ee990b19b23dc675cc2b4f30220161eea61a585d8669db6b82c707401e505e252e1927edae7c3f452d4bd4c5ca7",
        },
        {
          format: "datetime",
          label: "Approval expire",
          path: "deadline",
          signature:
            "304402206f7d715a5486e518edca9ada72137cbbb52192e4be80b5b34c8345485b5cfd470220304e412971df7c7fb62f4b33435bbed359abc760c16eab35c82dce6ce59f6ab1",
        },
      ],
    },
  "137:0x111111125421ca6dc452d289314280a0f8842a65:c4d135e3a126166bdee4e4859b77383074c8f046fb9b83e9cef7138c":
    {
      contractName: {
        label: "1inch Order",
        signature:
          "304402206cfe6a9208d04c77b8791386f5fcbb70756bdcdde0a0c20e7339bf571fcffec1022060361f073a31b833dc2f4c4064e2a2bb060f52a58db0e966b2e87a02bf01ea50",
      },
      fields: [
        {
          format: "raw",
          label: "From",
          path: "maker",
          signature:
            "304402200b8b50b3b13c63d2cc6242ad5644dc5f20bc919f57e266293824d0f555a20ae202206626bf02d487f4496c7423760ce4ed0de810bc11ee207ceec8b66d6c2de7bf9d",
        },
        {
          coin_ref: 0,
          format: "token",
          label: "Send",
          path: "makerAsset",
          signature:
            "304402204c2f225cf542e142dede6da5e51216053023e093748b457be37168ed87d63d4d022018cf762c9f6fe16d30899decb58037abb7c11f115f8b550c08b1f4005d444461",
        },
        {
          coin_ref: 0,
          format: "amount",
          label: "Send",
          path: "makingAmount",
          signature:
            "304502210091612542ceb9c385829f068e290f24c3375ebe0a990fbc67bd1543410c01497a02201cb25ec9aa00fc327d08fabb8946c151dfbb94ec8dcf6c48b90d367e17f0d7eb",
        },
        {
          coin_ref: 1,
          format: "token",
          label: "Receive minimum",
          path: "takerAsset",
          signature:
            "304402204d6075e9943d3a692612d07658a28361f389c1fc2d82ac2515526789e26d562b022015b1b2df1d1add3c686459ab0956559b77ffd2e3d0dc0a7178bc6ee185c6d5cc",
        },
        {
          coin_ref: 1,
          format: "amount",
          label: "Receive minimum",
          path: "takingAmount",
          signature:
            "3045022100f00a9be55f05be21fc8206b025683f32558827ba42b3fea4ab09b2a9a5fb3b68022066ec1859e1ecee756a1f1b02d9056b68cd5cc5dd2390f5f4a4e7c1f0564dd7f0",
        },
        {
          format: "raw",
          label: "To",
          path: "receiver",
          signature:
            "3044022020eb170b9844e3c6c3b61d34887bb3a3acb4ea9f8ac01600927f8e83916020cf0220603cbbdf91a5488a63673343279030cc04c477ec6a558c10d4507c71b4da3881",
        },
      ],
    },
};
