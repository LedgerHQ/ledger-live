export const v1 = {
  "5:0xcccccccccccccccccccccccccccccccccccccccc:1fd77fb96a82b9c1de173fa836e20da791158ea832a3d07c6725f47c":
    {
      contractName: {
        label: "Anakin",
        signature:
          "3044022063587552c233fa3a5cadbd298f6120cb77e29f4d4a2483831e9fb732edabe7f8022034a88f97e8fdc208800960968f7fbcc0c1d3b71aecdb241b2dd36dfca7ea6b32",
      },
      fields: [
        {
          label: "From",
          path: "from.name",
          signature:
            "3045022100f915a23c2654d761fb810d16c05757e8c1663c99a457b3903d1a5a76fbcb058d02205636516e2e5ab90d5879ad141c329f828d576b5c4cbdf7938b2cf86cb153dce5",
        },
        {
          label: "To",
          path: "to.name",
          signature:
            "3046022100df57f9370b82d1a144d988d085e721cc5e45ec5dab85c906787ed3d6c72d6e22022100cbe041b439cca1784299f42b0e646e03f7c5795f48645c60a0f3b21224167d0c",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:5b2c066ad15a55058a74d5698b12785338559cb982cab547e5d93e3d":
    {
      contractName: {
        label: "Chewie",
        signature:
          "304402200a68076edda783f20939d29795a2fa64a822ebfb06bf06af9c4deca472fd908002201c7e72fcb7e38bfcefb674cdcdc6a42beabb2d6557b18df9293eb2dea8994bd9",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "304402200c8991afadb1dbf395edaec90a709e3b4659794ec3f759b5f08e0b25d0656f9802201f50addfd159f669d8c2eb6273fb3c366ee8c5c707c9a59089bbc9f2b15304ac",
        },
        {
          label: "Recipients",
          path: "to.[].wallets.[]",
          signature:
            "3044022022827c43a60563768826f7d1003273828f373b2ddac58fab7f46398133b4e2360220293e311194fc604aac695663c0768e5174dbc82588a3ba445ade5a0513a6569d",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "3045022074c6e91513f214590fb7ca8e62a207f6c945a0a02ab96010d8e401eb391f2a36022100f5cfd20bb8903cbc1d6a686ab23764fae1319a6e10856443faaf1953ac9c6b7f",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:a6dfffb1ad68d66636f07152a977b48093ca6f0761283b54d3699419":
    {
      contractName: {
        label: "Padme",
        signature:
          "3045022100d68fd98d552a9e28ae4eadb265346b6a9a512ce7d9e64ab5281ab2db8a690bc502201f360b06b06a4b669f54bb632d4b84c155b173b6cce6793cb0ba4ed52dcd3afa",
      },
      fields: [
        {
          label: "Value ma man",
          path: "val",
          signature:
            "3044022020f273ed63ba6c5699829a8e40ec675d3ada63d50eb76a0dfbdf2a4b7ed0240402206f467c1fcef99b15206ba2ce88b4cf1c43df9da953868b9d4fb69ff8e1b69600",
        },
      ],
    },
  "1:0xcccccccccccccccccccccccccccccccccccccccc:7e916a5dd34dd8da7436fa22a4b79f250d77275e11273b38cdf5387c":
    {
      contractName: {
        label: "Darth Vador",
        signature:
          "304402200f1c42bb335dabf7d4e70aff3c694acd5d583c55f67ac69353c7089c2f331008022027c8b41271e2d9a49cf7b8ea1f051446fde487cfddb6ae596af2339e547b7cb9",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "3045022067c2da84e35ab7150d9b811ec10ee98c5a58927b7310cc1616be33672e4d0390022100f22b136e7cc5ec18001564749e773a209c9ccd09a097aba8ac29b43746dd976e",
        },
        {
          label: "Recipient",
          path: "to.members.[].name",
          signature:
            "3045022048084193d682f4085080db8f4878926ecda16ee99d8880f6fe8aec0ae82326f6022100983a85b4ccde51b6b6054207cde57af6e32ea0a69b997bad175bf02e28611173",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "304502206ac58f2720209633e0d7183b3e7d9aaf12fb99009ee865dcff2b528ecc6cdb31022100bee53af9d3d0b68a84bd72e772538af3def78e59ee70dec5a1c6df35dbf9e4f0",
        },
        {
          label: "Attachment",
          path: "attach.list.[].name",
          signature:
            "3045022013d1ea505a8b651a073781b134228c5945c30525ae1dbb90b60729cccae4cd6b0221008cd417efdd6e31f491354a3cad5e8aa3cc707081d83a13c0f4250ca793c0da6f",
        },
      ],
    },
  "0:0x0000000000000000000000000000000000000000:1b035bb23481b565164f6266cddba7d0a1de7819b7867218761e8a7d":
    {
      contractName: {
        label: "Palpatine",
        signature:
          "3046022100cb0d41cb506d27433d8ca3ca5c0888bced039de132adedca66895a5116c3af9f022100e22b6902aa07a68d71da702dcc8d44deec0d5483f8e29ed5d0e830e40a95892e",
      },
      fields: [
        {
          label: "Timestamp",
          path: "curDate",
          signature:
            "3045022100e9e974f4c04bdce33b81e5bc71d3b9d2f1c63d47f7b092d1cc0b5c52fb5d145f02204edacacfae8dc62c83836f31d3665a9104d40f2c1d34c24f3e4335eb493675de",
        },
        {
          label: "Identifier",
          path: "id",
          signature:
            "3045022100dd2ae125d66c0d53b8ff1cd869506aca393d7763766906894e072a9a0bccc6eb022056812867e63e2b81db36690111e922085db2d6390d6a5454c9ec3f248d969323",
        },
      ],
    },
  "1:0xcccccccccccccccccccccccccccccccccccccccc:8768c8db478d5e96fe52edadcd32dc5d182e48a9b51b4f166696f334":
    {
      contractName: {
        label: "Dark Maul",
        signature:
          "3046022100a1ee24c39a79d92bf33f1018fa04721e52db94501e9d1d52d28d08860c7a807d0221008ca107c6a0bf1a560f471959e2641105eb3cd7ea6ed0eb386d9508c3a55f554b",
      },
      fields: [
        {
          label: "Negative 256",
          path: "neg256",
          signature:
            "3046022100d4223b3a49c2719723fce18f32f1610d1af84f5a1e6cacd9f2ea31a08f25a3a5022100ff8be6d7bada8a9f991ebad771c4197a8d50b875b3794830bd9202ecf7dee291",
        },
        {
          label: "Positive 256",
          path: "pos256",
          signature:
            "3045022100812f27a5e993e89cbe2bf1662b226357272cbb6d37bec17ab1ccaf6666de1b48022078823c8c73802362e930146beee375bb6acdb6579c18a459b235e135a6197509",
        },
        {
          label: "Negative 128",
          path: "neg128",
          signature:
            "3046022100b34cb6b2300217ef2a1281bc69f89430735787637624861aa7848fdaa94ff5e102210099ad54641ec415e7ae26245f8eea52c7c4e97ee14ce9cb55505c80588df1de8f",
        },
        {
          label: "Positive 128",
          path: "pos128",
          signature:
            "304502210080453b062c7f7a47e1c4e58774682dde0023ad8646664a26fdb25e1de84c7392022069ade1e93ee8318d2c392b51fa6d088b19d8634188d792be58723a4dd5d2fde2",
        },
        {
          label: "Negative 64",
          path: "neg64",
          signature:
            "3045022022233aa92cd4deddfb1c09806e80cfabb238c2a5672c244d9af3778140e0f65f0221009ae16aee5f1b3b2bdfa1e2ec0518249333335584015ed444eafab4b3f1dba078",
        },
        {
          label: "Positive 64",
          path: "pos64",
          signature:
            "3044022024c209ad119ddd0939febd8eafd15e95f8e8923c7b35b4ca44206804f05eca7b0220665dfd4d143f497e263da7142ece011e3221d3acfb864e992d4e86df185331b0",
        },
        {
          label: "Negative 32",
          path: "neg32",
          signature:
            "3045022057c12e49d1a688ff7f1b4322015882b3c5bd6e7984d38d80b1659e4a8b736c0d022100fa74d3a71e237bfe46202b95afb2fe6ff93e7fd64a6a2b14a31465aec965bcb4",
        },
        {
          label: "Positive 32",
          path: "pos32",
          signature:
            "304502203b1ed09e5c5a892219b90f0b15894d516ab3f92d07c3d26dcc68e0630f4ec416022100eef30902bc4b97799ec60b5e8cf97209d93880bb3051f9e5d8c3182e9a98770a",
        },
        {
          label: "Negative 16",
          path: "neg16",
          signature:
            "304502210083072d1598238548b2dafb28ff8ed9f69ba039a0e202063b10d8f0825a106bd102202a98bd6012f2ece91be71e98e503614506aff3a9425e121fd00b87a69a5251d6",
        },
        {
          label: "Positive 16",
          path: "pos16",
          signature:
            "304402203f64e6f523779ce67e0b8aa3eef15093eebb9f1d9455e616d46faeb07e75d65602204fb4d652999e8be22acf7feb5014c5e2c8da6017bbed19239231b8a61194e528",
        },
        {
          label: "Negative 8",
          path: "neg8",
          signature:
            "3045022100e750bf41c848674a13aed18ec7675edad8d6e8e10428ebc6ba55eb764d74affd022050cbc317f5e062f7a8231cf810a854d1376c8cedc529d48ac5147c2430625a31",
        },
        {
          label: "Positive 8",
          path: "pos8",
          signature:
            "30450221009ac6447ea324722a93d97e0476e103d2e35401f9152693241f70777d215a320e02201c0a1ad742f3abde26ff1711fbf5d1d7a49765b074c812bbd94a0593dfbcac55",
        },
      ],
    },
  "1:0x7f268357a8c2552623316e2562d90e642bb538e5:d8e4f2bd77f7562e99ea5df4adb127291a2bfbc225ae55450038f27f":
    {
      contractName: {
        label: "Mace Windu",
        signature:
          "304502205098e783a362b1e3d33ae4d8a6ad4073dd5ad97da72d7ffe6ad41af17869a1f0022100c50ba9335788f82a2ef6d0d5e8b29ea83990346cccb73e887398b0a72ed4a2a1",
      },
      fields: [
        {
          label: "Maker",
          path: "maker",
          signature:
            "30450220476cc3309dd8104c87102df5fda3c6a760492676c2da3a9f4b4763156c97cf31022100bdaee8bcce4123b59d177ff9e15acfdc8d9a4286b4812479a0f3667ed5cefa4f",
        },
        {
          label: "Taker",
          path: "taker",
          signature:
            "3045022100ad6d6a772ddea2ad4ed7f1e2799846f8d520200418fb435eeb34ea35c46c445502200e602c58f398e5eefa8eef759940ceafd51bdc79b85b5b510dd48dccafe0660c",
        },
        {
          label: "Base Price",
          path: "basePrice",
          signature:
            "3045022100dfead31f8603678ae2eed97f0ea35963f7a00701067be4a58a9c95a03ce73c7702200ed8e835bfbfd336cc047341e7782c0e917ebc4768bdb59b594bf7edbf71885f",
        },
        {
          label: "Expiration Time",
          path: "expirationTime",
          signature:
            "304402207221ee5c1ad62447ae56bc01dd27057bdfd1e807deeaa335f225bc080b9f304f022030a6b8e6eb42287f757e3eac9695abfc68f31c8c358dbd814a4df62bb547ff1d",
        },
      ],
    },
  "1284:0xcccccccccccccccccccccccccccccccccccccccc:087da43b1d5a46a4acfe9437df4197f443a524ec658fbd0e8d305798":
    {
      contractName: {
        label: "Yoda",
        signature:
          "304402204a67f5c38317705c31acd936153d627756202370e6412bea13cd43e3cd7d5da802200e8debc34e70160ccc192e92d720d42399faad243740673e945ab3438f6a2ff6",
      },
      fields: [
        {
          label: "Sender",
          path: "from",
          signature:
            "30450220277c73383cfe014c12504b991339378123b9a339f005470060747b8ddb2ecfb1022100e29196c745c3b3fb4b6eab097e8972f06a390a2d31ff8deafde2f4ab4bb47392",
        },
        {
          label: "Recipients",
          path: "to.[]",
          signature:
            "304502203f4c1125e3133841e17fb6b579b69c4274d38eb2ca363cb0a2c52b30c52a53f7022100bbd38ad455363801af516ad7fc2dccbdf163cc547d1476113928c23079c67bcd",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "304502206cc88eb3eab3b55d5e6358d46e0fbbaefbd1590d01e77396a15a9f7887bbaaae02210080fab66195f75656134c67007761abfcc207afc075aaf3894e30fdf29e3daa7d",
        },
        {
          label: "Hello this is ID",
          path: "id",
          signature:
            "30450221008dcd615a78440f0ce412717d47903f71b7e0131766a72ef6ab189b02af36ac2802205f9ad7f6688f6e36f96442202f2d9f46532319ebf5f12ba3c92ca263ff08143a",
        },
      ],
    },
  "1:0x9757f2d2b135150bbeb65308d4a91804107cd8d6:139c059f886c2b9b41f05a6c4ec2578a048d18aaadbc095609e5df4b":
    {
      contractName: {
        label: "Boba",
        signature:
          "304502202f9e99e99544e9971c6e8c1f58901debd762fc96b6c388c24e921a72f3588a4a022100a9f80217965c99362424017d0fedfd25060fd4e5aae2daf85ac8cbef033fe7e2",
      },
      fields: [
        {
          label: "Maker",
          path: "maker",
          signature:
            "3045022100a2dd1bab1c723f5c4978ddfc3416bc32a3e665e1a2a798061ace5a171a821e66022012cd32cbb142b366548c46c0ae4688a174da5f63ece1ac88db5e9d82627daf8e",
        },
        {
          label: "Taker",
          path: "taker",
          signature:
            "3046022100cb5a8695a4c498dfd5e44b6af9238efb7baed439870b7534c81fd70cea8d4b23022100a49eec86927485697a41362455972926a7b6312ad78c1352f3051b69c1dc4f4f",
        },
      ],
    },
  "0:0x0000000000000000000000000000000000000000:e30e691e8ad018c90b84c64217c2e4abfe9881d27bcd0f8dd999f6b4":
    {
      contractName: {
        label: "R2D2",
        signature:
          "3044022056df947a834ef2bf6502e3e1ce611a34ff1b959c0ae366c2d1c8c361077d5a2d022045e7f8afc13d6cde7da3e0d95d834c2ce2d7cab49483d96b14cc35f1150f7215",
      },
      fields: [
        {
          label: "Document",
          path: "document.[].[]",
          signature:
            "3044022045a0a7d7b9a85be7b63e17872f1155be77330e2b3da5c892bc22baf853f9de4d022050136b6b284c317158e9c83135c83d3d9a692acfbc2a2e12c460878b260a4b5b",
        },
        {
          label: "Proof",
          path: "proof.[].[]",
          signature:
            "3046022100940e7b62f50c6dfc4944e381e218bb928190978ff5b131cb942a5d96be59bd3402210086e99e21dfdd95d4c6e3414e3e58e4a693e928c46ffa21bc768a9027ef1bd09f",
        },
        {
          label: "Depth",
          path: "depthy.[].[].[].[]",
          signature:
            "304402207a5f12624b8f5f6628f64520246d31ac24893876a33010307f8b500d212088be02205ea516cde61a61d6dece3d33949b91bfebf31427e199b7c6f94746bb2e81b7d8",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:7e916a5dd34dd8da7436fa22a4b79f250d77275e11273b38cdf5387c":
    {
      contractName: {
        label: "C3P0",
        signature:
          "304502203b0768bde7f99183d3687336d63e314ea6806bf125dfa9261d55b7319ee18fa3022100f9b711b626ec116318ef2ee2ac96a31746cd071c5caac3655adfcc1934161d51",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "3045022100ced76e0e61411b1ef5642586834e29ae9189974ce4338a9a9a2516e43edbde7302200a36170372164d778f873a4f5e95923ab09f48ac0cb9fa106f7f7d097e891eb9",
        },
        {
          label: "Recipient",
          path: "to.members.[].name",
          signature:
            "3044022100a9a05f12fbe643750f0c8a60b30dbc793077c2104dcf999a62303dba8458d65d021f6edd5f71a9c32b411f17df3fb1aa4721b356259cf77a48c4a44319806a5435",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "304502200f6f7be32f617791e4ed639ba294b8ab38e9a4f9c39e3fe415c4e03ab4674168022100853409de5fc10e80c2a406439ba184b28762dc74797e1e383b167676d8fae959",
        },
        {
          label: "Attachment",
          path: "attach.list.[].name",
          signature:
            "304502206650c083b2c895fba0fdb8edf952f56f443a6cdde0086aab469c38032f7aeb320221009c7acee25f280180c8cbf0038c1b3692a671cdab0651501948e6a2b59783c539",
        },
      ],
    },
  "5:0xccccccccccccccccccccccccccccccccccccccc1:5b2c066ad15a55058a74d5698b12785338559cb982cab547e5d93e3d":
    {
      contractName: {
        label: "Leia",
        signature:
          "3046022100d786a7581ca1bd313e8271cca5635e4b35ae69c13cce9664b2f61886979a5e94022100a45a87afd52f3ae630510dcde9139e98f1979f84efba29b85b5dac583605e225",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "3046022100fdf2641839d9eb35211a1dff0a642efffcdada1b4a735fed1dc8286cfef3a69f0221009ab91a098be77ed3fa385bb33300c3f6050f1871c2df1a420411b9049e018cf2",
        },
        {
          label: "Should be Alice & Bob",
          path: "to.[].name",
          signature:
            "3046022100ec0bb0ee7962ea0b89a4c1b81e7141c38f4fb3841dc254611b39357e98fa13710221009d38375810801157565b9e7338feb8f44babf4c3bfd46f9dff7be412684323d9",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "304502210084741fe267c0e68f588c2b46b7e9a33490912bfff0075fa0f35ea807707beba802204692e9380005cd613e0bd8177de9a9189fef1bbeee77a483df65f87b86dfc5a3",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:3863b554dca8a87c0367c3967cf1726802cdb6b7d4d1788301d35398":
    {
      contractName: {
        label: "Han",
        signature:
          "304602210090e6002a4b5b2a96409fbbfce11510a5ec3efc52139b43fb313e195ad7cab1a2022100eccaf2257b8f9e35c42c064ade707bfff9e04399730efa4e1460ccd444cdad1f",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "3045022076c5578debbf0c30422d46f546272bbee51d1983691b7f24098991b892f0fb05022100ee5aee20b96e7b60e8cb9d95a185140c5427d7f3b8c8795c9267cc5c52e0a962",
        },
        {
          label: "Recipients",
          path: "to.[].wallets.[]",
          signature:
            "3046022100ba2e37ab42de23f088924639d0c340352a013dd8258882f2fed42d2516313b68022100ec2474e9d083a7935251da520b35b08fe125d2153c7102afc8572135b42c3d0d",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "3044022052996b835132bf8248277b443439382bd3af11d4614052e9e03e22ab093a36dc02201ed76b7f35f1fd8d61a36abd65d70295d7db02a8e89623ecf4fbe0d01ef1106a",
        },
      ],
    },
  "1:0xcccccccccccccccccccccccccccccccccccccccc:0270aaaa8983a8ba018832814fadeb88ea930d63b4cc7acfa241cbff":
    {
      contractName: {
        label: "Dark Maul",
        signature:
          "3045022100de39788362c05cb30910cb4c19968fa560b4542fb423cc235a544fce6f959a6902207cc3ee39f5f34ea6a653188ae6fc189b27950c837bedf7e6d243d904b3fc2bf5",
      },
      fields: [
        {
          label: "Max UInt256",
          path: "max",
          signature:
            "3044022078c0dffd20a30d109a239d75967c72d3dc32992a202fecb66bef6392e6f9d537022071643b9700dc7a1306b1829fe66a583dda4db0d0980d273aade56ac917db89ff",
        },
        {
          label: "Min Int256",
          path: "neg256",
          signature:
            "3045022006564e0dfc69b6c264d591b8240225364b1b2ca59aa659fab9aa840894f17cf5022100b59e14e66978f433938ff6e267e8b3677e69265b30379e65a16458694586067c",
        },
        {
          label: "Max Int256",
          path: "pos256",
          signature:
            "3046022100b400948769b2315d2eaa2b2cf1a954b939ea72633333eacd7eb48a4049d16668022100c303719ad330dda6b351aab92648d0b64c992229c657265bc0d338cc1987f0de",
        },
        {
          label: "Min Int128",
          path: "neg128",
          signature:
            "3046022100a93da4fcbae42bdadabfd71d3e0ee2b01c5e444b389e67dbe27f5ec82bdc2c2b0221009f7bd6f88501340b627a04bdd7478e4bc93c0be206b9c3def2c9b07d6591d033",
        },
        {
          label: "Max Int128",
          path: "pos128",
          signature:
            "30460221009a7fef85d6c57a40ad0b7661322809a03fd62153277999688b54324f91245357022100923e53738e94b99af01819ad36c3f095fde94d7cf859118fbfa40ac25c3f422b",
        },
        {
          label: "Min Int64",
          path: "neg64",
          signature:
            "3045022100e159a15b0366603cb28f4a9646daab4ab42fd3fb4e0590b32f88192465df358702205cc164b3fe6bfe24007cd804f8d8053a51f53ff9f066e9c5cb9612c0ea69f240",
        },
        {
          label: "Max Int64",
          path: "pos64",
          signature:
            "30450221008a99fedd95c0c9f112b3448ebded92d031d000c9373eb85570ed0399d0fbe54d0220152e20a2ab45c88fd46de66b4a48f06eb2069285513849dce3240df048a42a93",
        },
        {
          label: "Min Int32",
          path: "neg32",
          signature:
            "3046022100dd364ea2741d7acaa54ba20319ac066bcbd0051841547efa3e902dd7ae139149022100eea484a02cda9ec353f4cbbd58e61f7514f3ae4e6c52e31ad111d4f1ad22627b",
        },
        {
          label: "Max Int32",
          path: "pos32",
          signature:
            "3046022100d989e8e665d4490fc5aead1c4580b594335a520edfb355eae7f861a2a479f69f022100aaea7e95cd9851fac86eb67cdbad1865d74dbb6e8655ea92814a7acf8c682e16",
        },
        {
          label: "Min Int16",
          path: "neg16",
          signature:
            "3046022100a9c3972100875d2ee99d9c7c4087cbc3d808650d73d48fd68bc42c4061317906022100f90ce13f28e4af7fe040b849ba89eb153a230e54439d313c1432234a81ffa2fe",
        },
        {
          label: "Max Int16",
          path: "pos16",
          signature:
            "3045022100ef489d1df222497dce64426a13c8fd78530eb22719eebcce1ee77ac745e77009022000b03f51200cc8c8e90a6d25d6f4ad82b3e5da70ce6e806386bce621e38d8a26",
        },
        {
          label: "Min Int8",
          path: "neg8",
          signature:
            "3046022100a3c1c24fd5b3705cbdc2e35e4de49147cd178554f32d33ef78b538c01e8c73d9022100aeb71d657345b52bd06a42d1a2099f5a9a6f42d5d06a9b50581e1959ab6ac772",
        },
        {
          label: "Max Int8",
          path: "pos8",
          signature:
            "3046022100c2761449f313cbfc55376fb31c12283833dfd5a49273a5ff4022645043a2a64b0221009640e0d52de7f9481b3157fa1b3ad05a7fc0b018d1539d526fbd299d9ba6471d",
        },
      ],
    },
  "1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48:d4dd8410bdcf861c48d353f8e3a9b738282a0fd9ba7239f59baa9099":
    {
      contractName: {
        label: "Permit USDC transfers",
        signature:
          "30440220206a52ce36fb75683481981c6f1f2e1cc405da8b7172b4fe3b465b19139bd66602200d5d2a800a253881fe4d87ebaf57fffbc7fbb8591ebe251ac69d650469b51d16",
      },
      fields: [
        {
          label: "From",
          path: "owner",
          signature:
            "3044022048b3e79d00220b5fb5908cb13264f0a10ab1faa1f9c95702c4dcb91aefa2475a02204096676422035d37f30a9fea09553d5d1751413e5a2cb60d1b9919aa33e166b1",
        },
        {
          label: "Approve to spender",
          path: "spender",
          signature:
            "3045022100da7a47dbc3c943c29f2211e139c5dc43b6c54d79d4aec205694155a8a2bed5b902202f1a885a2a6de6b705f8cfe87d6994e470c779f8bb8e6e52166c4e41437e605f",
        },
        {
          label: "Amount allowance",
          path: "value",
          signature:
            "3045022100fc3e850699e3abfcbca2f4258f248573b43c91b2dd8d59d423804518b2e5f79502200868300f4a75b3f77b35e7f45511fdd4e7717604d416841052b9a0a27b1087e1",
        },
        {
          label: "Approval expire",
          path: "deadline",
          signature:
            "3045022100e809928ed622936a7a8d03141dd7b477ec92243918293e6ea48d32c0f90b70ea022054065681702e458131a18cb8e8eb588618bda83b1a24ff5bddacdfc060ce851d",
        },
      ],
    },
  "137:0x000000000022d473030f116ddee9f6b43ac78ba3:4d593149e876e739220f3b5ede1b38a0213d76c4705b1547c4323df3":
    {
      contractName: {
        label: "Permit2",
        signature:
          "3045022100d259cbf0306cda1fbd842725394b29020aaa05159884cdff8c256ad87e6d55ea02205e5c7bbbbc030c2e1362e41185312aa8140802495fed2325031da2af79dde7a4",
      },
      fields: [
        {
          label: "Amount allowance",
          path: "details.token",
          signature:
            "3045022100b0c62b0c9e085b87332b8a32a7106ca20027f41501abf28f2ef6eddcfee70cb2022048fc3ff7d0e8840f4f6581f0026d2099034011b572a9b87804e2e5b4559a708e",
        },
        {
          label: "Amount allowance",
          path: "details.amount",
          signature:
            "304402206f542985fa2aa16417942f0daceb72b951c2c485088cb8dfa79cba7358f1cc0a02202d31f11b13df2f15c143c727dafc2aee2c34d6df8eba28e8c44d9a5d16493c49",
        },
        {
          label: "Approve to spender",
          path: "spender",
          signature:
            "304402207d9c68450fd568c07e5b5ecffe29747c64d247cc1ccc8cce83d4112d029317d202206c631ddb8ea90ad75aa1339f2e966b72193758615f303af6c8f94c733f6e877c",
        },
        {
          label: "Approval expire",
          path: "details.expiration",
          signature:
            "304402206a2fffb754431f7c4bccf3e9e4d0685d90717e995e4c719dcf56fa55d0601dad022021f53e18abaa4ac5ecbccbe2e87d16acae1883e78ff6de3427ba0c2a306bae81",
        },
      ],
    },
  "42161:0x000000000022d473030f116ddee9f6b43ac78ba3:a35a03a79619e46c3773d8880c952f7caeea45674557cfd2470e8fc5":
    {
      contractName: {
        label: "UniswapX Exclusive Dutch Order",
        signature:
          "304502210087b5fd4ca85d8d902459aabf0cfb97c676809c967b84c8a8301838f54d2f144602200d268e03f892d81b35ac1bd493310f4fb65a202c2ad2ebec3f427978756b3106",
      },
      fields: [
        {
          label: "Approve to spender",
          path: "spender",
          signature:
            "3045022100b5e936abd5df8c51ae2ee04b8f06e58162c5702083fddce3494b19c9bc9c2e01022032e9c8fdfd04c78d70d0f1e03e1fe716afc7bb2d2f643cb4586316e87a7c2150",
        },
        {
          label: "Amount allowance",
          path: "permitted.token",
          signature:
            "30450221008f6d92026f956e9a4635ea2877fcff52b58349050e14e446175d668464090fed022051ace7037868f8984aa208c8d9b7d8a94cd22a93b83e9ca8911227d0f5e5747b",
        },
        {
          label: "Amount allowance",
          path: "permitted.amount",
          signature:
            "30440220659cebc0ec70ec020a1c0ec8dd6a4ce650a836ceddda28d9c26d01404ce03bf402205ff6c87cace6b7b575a341347d81927a8fb0650d53cfa2020eb13b542ce68780",
        },
        {
          label: "To swap",
          path: "witness.inputToken",
          signature:
            "3044022100d2a7086532e5076845eef95cd717a59527499db3e32081bc54f1d194cb03091c021f2a2c5b8062b9b48bce8993ba878bd516d6123a022537319a3671be2554f4f9",
        },
        {
          label: "To swap",
          path: "witness.inputStartAmount",
          signature:
            "3044022039f099a0c207376807f176374b8ddd15b4b0d54396915ecf071e120e4002c8e4022024478aa5c1074cda3755894674a55e21e773b83fc6b74e55822b2d05cab29cce",
        },
        {
          label: "Tokens to receive",
          path: "witness.outputs.[].tokens",
          signature:
            "3044022012200dbd0f9badcb2b27407289e2f87db36900cbc885e4f5cf70def72af8a83c022042d69ea567ec837c8efd443c135b2f807715dd64fb04900d95515530373f36ff",
        },
        {
          label: "Minimum amounts to receive",
          path: "witness.outputs.[].amount",
          signature:
            "3045022100b98951b5fdd4b51aafac8ca1f2c9d186be8d52eb989f8e8b8d6937964a30e7ef02201f974191cc577b7ed3221e5dfee07aeee19bd361418c95e76589ada56b3e3b76",
        },
        {
          label: "On Addresses",
          path: "witness.outputs.[].recipient",
          signature:
            "3045022100eb5d8a309b9b9865377f4b430acc4ac5845c6b4339ce2bb9228fc76947904e3b02207530da05e41c522a6385d0cb586cb459305e98b45d32d0decc078081781986ae",
        },
        {
          label: "Approval expire",
          path: "deadline",
          signature:
            "30440220641f8f08fd8041a66afbeaced49baebf1b9da777154391dc73c65bea935579c1022042d5bd8a956823bf2640618c1ec9781e198ff2e139674c9cff1ea5c795219cd0",
        },
      ],
    },
  "137:0x111111125421ca6dc452d289314280a0f8842a65:c4d135e3a126166bdee4e4859b77383074c8f046fb9b83e9cef7138c":
    {
      contractName: {
        label: "1inch Order",
        signature:
          "30440220295e0aeb17ca0929b2a94c324d67d0b5528aba268177f3ac297b563141e0002702203ac360d9fd0c9c0c12279d1e73bea5d549a1e8141f454d88fbe1e8ef970e6802",
      },
      fields: [
        {
          label: "From",
          path: "maker",
          signature:
            "3045022100b820e4dfb1a0cde6dc97d9a34eebb1a4eef0b226262e6788118ab3c7fb79fe3502202d426a388b4c3a8096b3f84412a702ea537770e61ee0727ec1b710c1da520c44",
        },
        {
          label: "Send",
          path: "makerAsset",
          signature:
            "304402201500b44b1eb5b016ebe5bd7d5cc74b011544b357411a608c3a9f14f259ccfd1c0220617cdeaf7b72edc69aa4ce33828b2ae1bf9d80f62af064ed206d348de5ce67dc",
        },
        {
          label: "Send",
          path: "makingAmount",
          signature:
            "3045022100b1df6581805f596ed6ead231bad279f2f512ed1fffdc2ff082c381b63b5eeb7a02201363fe8f5b9904f338bc1e7d2dc9adece3d33c224c68f2fd669dd943ccd32080",
        },
        {
          label: "Receive minimum",
          path: "takerAsset",
          signature:
            "304402203329dae6e283d1b00829fd0fdbd4f753ebdf2bd911183af250bacc80341dd3d302205de19c3a200b3e49597a9f02664a262827a64e28d8f24b37808c7c78f727588b",
        },
        {
          label: "Receive minimum",
          path: "takingAmount",
          signature:
            "3044022019d6a6cd953447adf2cb0202ecfb0282d3d4bee6aec4c1a2a14e1e8a1e7f732b02201dd3a8b47cda33159a331335c5ac1136e36b5d8e4b29edd99f65cdaf5f5e0c4a",
        },
        {
          label: "To",
          path: "receiver",
          signature:
            "304402205c5b1740d2e74513a9332e3160ebfe5996186c68141055a95d733d51eb51dff402201a1e085dcd9487bdabe9e04426cd8b043c5bf158843fed944affdeef0768ad43",
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
          "3044022063587552c233fa3a5cadbd298f6120cb77e29f4d4a2483831e9fb732edabe7f8022034a88f97e8fdc208800960968f7fbcc0c1d3b71aecdb241b2dd36dfca7ea6b32",
      },
      fields: [
        {
          label: "From",
          path: "from.name",
          signature:
            "3045022100f915a23c2654d761fb810d16c05757e8c1663c99a457b3903d1a5a76fbcb058d02205636516e2e5ab90d5879ad141c329f828d576b5c4cbdf7938b2cf86cb153dce5",
        },
        {
          label: "To",
          path: "to.name",
          signature:
            "3046022100df57f9370b82d1a144d988d085e721cc5e45ec5dab85c906787ed3d6c72d6e22022100cbe041b439cca1784299f42b0e646e03f7c5795f48645c60a0f3b21224167d0c",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:5b2c066ad15a55058a74d5698b12785338559cb982cab547e5d93e3d":
    {
      contractName: {
        label: "Chewie",
        signature:
          "304402200a68076edda783f20939d29795a2fa64a822ebfb06bf06af9c4deca472fd908002201c7e72fcb7e38bfcefb674cdcdc6a42beabb2d6557b18df9293eb2dea8994bd9",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "304402200c8991afadb1dbf395edaec90a709e3b4659794ec3f759b5f08e0b25d0656f9802201f50addfd159f669d8c2eb6273fb3c366ee8c5c707c9a59089bbc9f2b15304ac",
        },
        {
          label: "Recipients",
          path: "to.[].wallets.[]",
          signature:
            "3044022022827c43a60563768826f7d1003273828f373b2ddac58fab7f46398133b4e2360220293e311194fc604aac695663c0768e5174dbc82588a3ba445ade5a0513a6569d",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "3045022074c6e91513f214590fb7ca8e62a207f6c945a0a02ab96010d8e401eb391f2a36022100f5cfd20bb8903cbc1d6a686ab23764fae1319a6e10856443faaf1953ac9c6b7f",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:a6dfffb1ad68d66636f07152a977b48093ca6f0761283b54d3699419":
    {
      contractName: {
        label: "Padme",
        signature:
          "3045022100d68fd98d552a9e28ae4eadb265346b6a9a512ce7d9e64ab5281ab2db8a690bc502201f360b06b06a4b669f54bb632d4b84c155b173b6cce6793cb0ba4ed52dcd3afa",
      },
      fields: [
        {
          label: "Value ma man",
          path: "val",
          signature:
            "3044022020f273ed63ba6c5699829a8e40ec675d3ada63d50eb76a0dfbdf2a4b7ed0240402206f467c1fcef99b15206ba2ce88b4cf1c43df9da953868b9d4fb69ff8e1b69600",
        },
      ],
    },
  "1:0xcccccccccccccccccccccccccccccccccccccccc:7e916a5dd34dd8da7436fa22a4b79f250d77275e11273b38cdf5387c":
    {
      contractName: {
        label: "Darth Vador",
        signature:
          "304402200f1c42bb335dabf7d4e70aff3c694acd5d583c55f67ac69353c7089c2f331008022027c8b41271e2d9a49cf7b8ea1f051446fde487cfddb6ae596af2339e547b7cb9",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "3045022067c2da84e35ab7150d9b811ec10ee98c5a58927b7310cc1616be33672e4d0390022100f22b136e7cc5ec18001564749e773a209c9ccd09a097aba8ac29b43746dd976e",
        },
        {
          label: "Recipient",
          path: "to.members.[].name",
          signature:
            "3045022048084193d682f4085080db8f4878926ecda16ee99d8880f6fe8aec0ae82326f6022100983a85b4ccde51b6b6054207cde57af6e32ea0a69b997bad175bf02e28611173",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "304502206ac58f2720209633e0d7183b3e7d9aaf12fb99009ee865dcff2b528ecc6cdb31022100bee53af9d3d0b68a84bd72e772538af3def78e59ee70dec5a1c6df35dbf9e4f0",
        },
        {
          label: "Attachment",
          path: "attach.list.[].name",
          signature:
            "3045022013d1ea505a8b651a073781b134228c5945c30525ae1dbb90b60729cccae4cd6b0221008cd417efdd6e31f491354a3cad5e8aa3cc707081d83a13c0f4250ca793c0da6f",
        },
      ],
    },
  "0:0x0000000000000000000000000000000000000000:1b035bb23481b565164f6266cddba7d0a1de7819b7867218761e8a7d":
    {
      contractName: {
        label: "Palpatine",
        signature:
          "3046022100cb0d41cb506d27433d8ca3ca5c0888bced039de132adedca66895a5116c3af9f022100e22b6902aa07a68d71da702dcc8d44deec0d5483f8e29ed5d0e830e40a95892e",
      },
      fields: [
        {
          label: "Timestamp",
          path: "curDate",
          signature:
            "3045022100e9e974f4c04bdce33b81e5bc71d3b9d2f1c63d47f7b092d1cc0b5c52fb5d145f02204edacacfae8dc62c83836f31d3665a9104d40f2c1d34c24f3e4335eb493675de",
        },
        {
          label: "Identifier",
          path: "id",
          signature:
            "3045022100dd2ae125d66c0d53b8ff1cd869506aca393d7763766906894e072a9a0bccc6eb022056812867e63e2b81db36690111e922085db2d6390d6a5454c9ec3f248d969323",
        },
      ],
    },
  "1:0xcccccccccccccccccccccccccccccccccccccccc:8768c8db478d5e96fe52edadcd32dc5d182e48a9b51b4f166696f334":
    {
      contractName: {
        label: "Dark Maul",
        signature:
          "3046022100a1ee24c39a79d92bf33f1018fa04721e52db94501e9d1d52d28d08860c7a807d0221008ca107c6a0bf1a560f471959e2641105eb3cd7ea6ed0eb386d9508c3a55f554b",
      },
      fields: [
        {
          label: "Negative 256",
          path: "neg256",
          signature:
            "3046022100d4223b3a49c2719723fce18f32f1610d1af84f5a1e6cacd9f2ea31a08f25a3a5022100ff8be6d7bada8a9f991ebad771c4197a8d50b875b3794830bd9202ecf7dee291",
        },
        {
          label: "Positive 256",
          path: "pos256",
          signature:
            "3045022100812f27a5e993e89cbe2bf1662b226357272cbb6d37bec17ab1ccaf6666de1b48022078823c8c73802362e930146beee375bb6acdb6579c18a459b235e135a6197509",
        },
        {
          label: "Negative 128",
          path: "neg128",
          signature:
            "3046022100b34cb6b2300217ef2a1281bc69f89430735787637624861aa7848fdaa94ff5e102210099ad54641ec415e7ae26245f8eea52c7c4e97ee14ce9cb55505c80588df1de8f",
        },
        {
          label: "Positive 128",
          path: "pos128",
          signature:
            "304502210080453b062c7f7a47e1c4e58774682dde0023ad8646664a26fdb25e1de84c7392022069ade1e93ee8318d2c392b51fa6d088b19d8634188d792be58723a4dd5d2fde2",
        },
        {
          label: "Negative 64",
          path: "neg64",
          signature:
            "3045022022233aa92cd4deddfb1c09806e80cfabb238c2a5672c244d9af3778140e0f65f0221009ae16aee5f1b3b2bdfa1e2ec0518249333335584015ed444eafab4b3f1dba078",
        },
        {
          label: "Positive 64",
          path: "pos64",
          signature:
            "3044022024c209ad119ddd0939febd8eafd15e95f8e8923c7b35b4ca44206804f05eca7b0220665dfd4d143f497e263da7142ece011e3221d3acfb864e992d4e86df185331b0",
        },
        {
          label: "Negative 32",
          path: "neg32",
          signature:
            "3045022057c12e49d1a688ff7f1b4322015882b3c5bd6e7984d38d80b1659e4a8b736c0d022100fa74d3a71e237bfe46202b95afb2fe6ff93e7fd64a6a2b14a31465aec965bcb4",
        },
        {
          label: "Positive 32",
          path: "pos32",
          signature:
            "304502203b1ed09e5c5a892219b90f0b15894d516ab3f92d07c3d26dcc68e0630f4ec416022100eef30902bc4b97799ec60b5e8cf97209d93880bb3051f9e5d8c3182e9a98770a",
        },
        {
          label: "Negative 16",
          path: "neg16",
          signature:
            "304502210083072d1598238548b2dafb28ff8ed9f69ba039a0e202063b10d8f0825a106bd102202a98bd6012f2ece91be71e98e503614506aff3a9425e121fd00b87a69a5251d6",
        },
        {
          label: "Positive 16",
          path: "pos16",
          signature:
            "304402203f64e6f523779ce67e0b8aa3eef15093eebb9f1d9455e616d46faeb07e75d65602204fb4d652999e8be22acf7feb5014c5e2c8da6017bbed19239231b8a61194e528",
        },
        {
          label: "Negative 8",
          path: "neg8",
          signature:
            "3045022100e750bf41c848674a13aed18ec7675edad8d6e8e10428ebc6ba55eb764d74affd022050cbc317f5e062f7a8231cf810a854d1376c8cedc529d48ac5147c2430625a31",
        },
        {
          label: "Positive 8",
          path: "pos8",
          signature:
            "30450221009ac6447ea324722a93d97e0476e103d2e35401f9152693241f70777d215a320e02201c0a1ad742f3abde26ff1711fbf5d1d7a49765b074c812bbd94a0593dfbcac55",
        },
      ],
    },
  "1:0x7f268357a8c2552623316e2562d90e642bb538e5:d8e4f2bd77f7562e99ea5df4adb127291a2bfbc225ae55450038f27f":
    {
      contractName: {
        label: "Mace Windu",
        signature:
          "304502205098e783a362b1e3d33ae4d8a6ad4073dd5ad97da72d7ffe6ad41af17869a1f0022100c50ba9335788f82a2ef6d0d5e8b29ea83990346cccb73e887398b0a72ed4a2a1",
      },
      fields: [
        {
          label: "Maker",
          path: "maker",
          signature:
            "30450220476cc3309dd8104c87102df5fda3c6a760492676c2da3a9f4b4763156c97cf31022100bdaee8bcce4123b59d177ff9e15acfdc8d9a4286b4812479a0f3667ed5cefa4f",
        },
        {
          label: "Taker",
          path: "taker",
          signature:
            "3045022100ad6d6a772ddea2ad4ed7f1e2799846f8d520200418fb435eeb34ea35c46c445502200e602c58f398e5eefa8eef759940ceafd51bdc79b85b5b510dd48dccafe0660c",
        },
        {
          label: "Base Price",
          path: "basePrice",
          signature:
            "3045022100dfead31f8603678ae2eed97f0ea35963f7a00701067be4a58a9c95a03ce73c7702200ed8e835bfbfd336cc047341e7782c0e917ebc4768bdb59b594bf7edbf71885f",
        },
        {
          label: "Expiration Time",
          path: "expirationTime",
          signature:
            "304402207221ee5c1ad62447ae56bc01dd27057bdfd1e807deeaa335f225bc080b9f304f022030a6b8e6eb42287f757e3eac9695abfc68f31c8c358dbd814a4df62bb547ff1d",
        },
      ],
    },
  "1284:0xcccccccccccccccccccccccccccccccccccccccc:087da43b1d5a46a4acfe9437df4197f443a524ec658fbd0e8d305798":
    {
      contractName: {
        label: "Yoda",
        signature:
          "304402204a67f5c38317705c31acd936153d627756202370e6412bea13cd43e3cd7d5da802200e8debc34e70160ccc192e92d720d42399faad243740673e945ab3438f6a2ff6",
      },
      fields: [
        {
          label: "Sender",
          path: "from",
          signature:
            "30450220277c73383cfe014c12504b991339378123b9a339f005470060747b8ddb2ecfb1022100e29196c745c3b3fb4b6eab097e8972f06a390a2d31ff8deafde2f4ab4bb47392",
        },
        {
          label: "Recipients",
          path: "to.[]",
          signature:
            "304502203f4c1125e3133841e17fb6b579b69c4274d38eb2ca363cb0a2c52b30c52a53f7022100bbd38ad455363801af516ad7fc2dccbdf163cc547d1476113928c23079c67bcd",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "304502206cc88eb3eab3b55d5e6358d46e0fbbaefbd1590d01e77396a15a9f7887bbaaae02210080fab66195f75656134c67007761abfcc207afc075aaf3894e30fdf29e3daa7d",
        },
        {
          label: "Hello this is ID",
          path: "id",
          signature:
            "30450221008dcd615a78440f0ce412717d47903f71b7e0131766a72ef6ab189b02af36ac2802205f9ad7f6688f6e36f96442202f2d9f46532319ebf5f12ba3c92ca263ff08143a",
        },
      ],
    },
  "1:0x9757f2d2b135150bbeb65308d4a91804107cd8d6:139c059f886c2b9b41f05a6c4ec2578a048d18aaadbc095609e5df4b":
    {
      contractName: {
        label: "Boba",
        signature:
          "304502202f9e99e99544e9971c6e8c1f58901debd762fc96b6c388c24e921a72f3588a4a022100a9f80217965c99362424017d0fedfd25060fd4e5aae2daf85ac8cbef033fe7e2",
      },
      fields: [
        {
          label: "Maker",
          path: "maker",
          signature:
            "3045022100a2dd1bab1c723f5c4978ddfc3416bc32a3e665e1a2a798061ace5a171a821e66022012cd32cbb142b366548c46c0ae4688a174da5f63ece1ac88db5e9d82627daf8e",
        },
        {
          label: "Taker",
          path: "taker",
          signature:
            "3046022100cb5a8695a4c498dfd5e44b6af9238efb7baed439870b7534c81fd70cea8d4b23022100a49eec86927485697a41362455972926a7b6312ad78c1352f3051b69c1dc4f4f",
        },
      ],
    },
  "0:0x0000000000000000000000000000000000000000:e30e691e8ad018c90b84c64217c2e4abfe9881d27bcd0f8dd999f6b4":
    {
      contractName: {
        label: "R2D2",
        signature:
          "3044022056df947a834ef2bf6502e3e1ce611a34ff1b959c0ae366c2d1c8c361077d5a2d022045e7f8afc13d6cde7da3e0d95d834c2ce2d7cab49483d96b14cc35f1150f7215",
      },
      fields: [
        {
          label: "Document",
          path: "document.[].[]",
          signature:
            "3044022045a0a7d7b9a85be7b63e17872f1155be77330e2b3da5c892bc22baf853f9de4d022050136b6b284c317158e9c83135c83d3d9a692acfbc2a2e12c460878b260a4b5b",
        },
        {
          label: "Proof",
          path: "proof.[].[]",
          signature:
            "3046022100940e7b62f50c6dfc4944e381e218bb928190978ff5b131cb942a5d96be59bd3402210086e99e21dfdd95d4c6e3414e3e58e4a693e928c46ffa21bc768a9027ef1bd09f",
        },
        {
          label: "Depth",
          path: "depthy.[].[].[].[]",
          signature:
            "304402207a5f12624b8f5f6628f64520246d31ac24893876a33010307f8b500d212088be02205ea516cde61a61d6dece3d33949b91bfebf31427e199b7c6f94746bb2e81b7d8",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:7e916a5dd34dd8da7436fa22a4b79f250d77275e11273b38cdf5387c":
    {
      contractName: {
        label: "C3P0",
        signature:
          "304502203b0768bde7f99183d3687336d63e314ea6806bf125dfa9261d55b7319ee18fa3022100f9b711b626ec116318ef2ee2ac96a31746cd071c5caac3655adfcc1934161d51",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "3045022100ced76e0e61411b1ef5642586834e29ae9189974ce4338a9a9a2516e43edbde7302200a36170372164d778f873a4f5e95923ab09f48ac0cb9fa106f7f7d097e891eb9",
        },
        {
          label: "Recipient",
          path: "to.members.[].name",
          signature:
            "3044022100a9a05f12fbe643750f0c8a60b30dbc793077c2104dcf999a62303dba8458d65d021f6edd5f71a9c32b411f17df3fb1aa4721b356259cf77a48c4a44319806a5435",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "304502200f6f7be32f617791e4ed639ba294b8ab38e9a4f9c39e3fe415c4e03ab4674168022100853409de5fc10e80c2a406439ba184b28762dc74797e1e383b167676d8fae959",
        },
        {
          label: "Attachment",
          path: "attach.list.[].name",
          signature:
            "304502206650c083b2c895fba0fdb8edf952f56f443a6cdde0086aab469c38032f7aeb320221009c7acee25f280180c8cbf0038c1b3692a671cdab0651501948e6a2b59783c539",
        },
      ],
    },
  "5:0xccccccccccccccccccccccccccccccccccccccc1:5b2c066ad15a55058a74d5698b12785338559cb982cab547e5d93e3d":
    {
      contractName: {
        label: "Leia",
        signature:
          "3046022100d786a7581ca1bd313e8271cca5635e4b35ae69c13cce9664b2f61886979a5e94022100a45a87afd52f3ae630510dcde9139e98f1979f84efba29b85b5dac583605e225",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "3046022100fdf2641839d9eb35211a1dff0a642efffcdada1b4a735fed1dc8286cfef3a69f0221009ab91a098be77ed3fa385bb33300c3f6050f1871c2df1a420411b9049e018cf2",
        },
        {
          label: "Should be Alice & Bob",
          path: "to.[].name",
          signature:
            "3046022100ec0bb0ee7962ea0b89a4c1b81e7141c38f4fb3841dc254611b39357e98fa13710221009d38375810801157565b9e7338feb8f44babf4c3bfd46f9dff7be412684323d9",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "304502210084741fe267c0e68f588c2b46b7e9a33490912bfff0075fa0f35ea807707beba802204692e9380005cd613e0bd8177de9a9189fef1bbeee77a483df65f87b86dfc5a3",
        },
      ],
    },
  "5:0xcccccccccccccccccccccccccccccccccccccccc:3863b554dca8a87c0367c3967cf1726802cdb6b7d4d1788301d35398":
    {
      contractName: {
        label: "Han",
        signature:
          "304602210090e6002a4b5b2a96409fbbfce11510a5ec3efc52139b43fb313e195ad7cab1a2022100eccaf2257b8f9e35c42c064ade707bfff9e04399730efa4e1460ccd444cdad1f",
      },
      fields: [
        {
          label: "Sender",
          path: "from.name",
          signature:
            "3045022076c5578debbf0c30422d46f546272bbee51d1983691b7f24098991b892f0fb05022100ee5aee20b96e7b60e8cb9d95a185140c5427d7f3b8c8795c9267cc5c52e0a962",
        },
        {
          label: "Recipients",
          path: "to.[].wallets.[]",
          signature:
            "3046022100ba2e37ab42de23f088924639d0c340352a013dd8258882f2fed42d2516313b68022100ec2474e9d083a7935251da520b35b08fe125d2153c7102afc8572135b42c3d0d",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "3044022052996b835132bf8248277b443439382bd3af11d4614052e9e03e22ab093a36dc02201ed76b7f35f1fd8d61a36abd65d70295d7db02a8e89623ecf4fbe0d01ef1106a",
        },
      ],
    },
  "1:0xcccccccccccccccccccccccccccccccccccccccc:0270aaaa8983a8ba018832814fadeb88ea930d63b4cc7acfa241cbff":
    {
      contractName: {
        label: "Dark Maul",
        signature:
          "3045022100de39788362c05cb30910cb4c19968fa560b4542fb423cc235a544fce6f959a6902207cc3ee39f5f34ea6a653188ae6fc189b27950c837bedf7e6d243d904b3fc2bf5",
      },
      fields: [
        {
          label: "Max UInt256",
          path: "max",
          signature:
            "3044022078c0dffd20a30d109a239d75967c72d3dc32992a202fecb66bef6392e6f9d537022071643b9700dc7a1306b1829fe66a583dda4db0d0980d273aade56ac917db89ff",
        },
        {
          label: "Min Int256",
          path: "neg256",
          signature:
            "3045022006564e0dfc69b6c264d591b8240225364b1b2ca59aa659fab9aa840894f17cf5022100b59e14e66978f433938ff6e267e8b3677e69265b30379e65a16458694586067c",
        },
        {
          label: "Max Int256",
          path: "pos256",
          signature:
            "3046022100b400948769b2315d2eaa2b2cf1a954b939ea72633333eacd7eb48a4049d16668022100c303719ad330dda6b351aab92648d0b64c992229c657265bc0d338cc1987f0de",
        },
        {
          label: "Min Int128",
          path: "neg128",
          signature:
            "3046022100a93da4fcbae42bdadabfd71d3e0ee2b01c5e444b389e67dbe27f5ec82bdc2c2b0221009f7bd6f88501340b627a04bdd7478e4bc93c0be206b9c3def2c9b07d6591d033",
        },
        {
          label: "Max Int128",
          path: "pos128",
          signature:
            "30460221009a7fef85d6c57a40ad0b7661322809a03fd62153277999688b54324f91245357022100923e53738e94b99af01819ad36c3f095fde94d7cf859118fbfa40ac25c3f422b",
        },
        {
          label: "Min Int64",
          path: "neg64",
          signature:
            "3045022100e159a15b0366603cb28f4a9646daab4ab42fd3fb4e0590b32f88192465df358702205cc164b3fe6bfe24007cd804f8d8053a51f53ff9f066e9c5cb9612c0ea69f240",
        },
        {
          label: "Max Int64",
          path: "pos64",
          signature:
            "30450221008a99fedd95c0c9f112b3448ebded92d031d000c9373eb85570ed0399d0fbe54d0220152e20a2ab45c88fd46de66b4a48f06eb2069285513849dce3240df048a42a93",
        },
        {
          label: "Min Int32",
          path: "neg32",
          signature:
            "3046022100dd364ea2741d7acaa54ba20319ac066bcbd0051841547efa3e902dd7ae139149022100eea484a02cda9ec353f4cbbd58e61f7514f3ae4e6c52e31ad111d4f1ad22627b",
        },
        {
          label: "Max Int32",
          path: "pos32",
          signature:
            "3046022100d989e8e665d4490fc5aead1c4580b594335a520edfb355eae7f861a2a479f69f022100aaea7e95cd9851fac86eb67cdbad1865d74dbb6e8655ea92814a7acf8c682e16",
        },
        {
          label: "Min Int16",
          path: "neg16",
          signature:
            "3046022100a9c3972100875d2ee99d9c7c4087cbc3d808650d73d48fd68bc42c4061317906022100f90ce13f28e4af7fe040b849ba89eb153a230e54439d313c1432234a81ffa2fe",
        },
        {
          label: "Max Int16",
          path: "pos16",
          signature:
            "3045022100ef489d1df222497dce64426a13c8fd78530eb22719eebcce1ee77ac745e77009022000b03f51200cc8c8e90a6d25d6f4ad82b3e5da70ce6e806386bce621e38d8a26",
        },
        {
          label: "Min Int8",
          path: "neg8",
          signature:
            "3046022100a3c1c24fd5b3705cbdc2e35e4de49147cd178554f32d33ef78b538c01e8c73d9022100aeb71d657345b52bd06a42d1a2099f5a9a6f42d5d06a9b50581e1959ab6ac772",
        },
        {
          label: "Max Int8",
          path: "pos8",
          signature:
            "3046022100c2761449f313cbfc55376fb31c12283833dfd5a49273a5ff4022645043a2a64b0221009640e0d52de7f9481b3157fa1b3ad05a7fc0b018d1539d526fbd299d9ba6471d",
        },
      ],
    },
  "1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48:d4dd8410bdcf861c48d353f8e3a9b738282a0fd9ba7239f59baa9099":
    {
      contractName: {
        label: "Permit USDC transfers",
        signature:
          "30440220206a52ce36fb75683481981c6f1f2e1cc405da8b7172b4fe3b465b19139bd66602200d5d2a800a253881fe4d87ebaf57fffbc7fbb8591ebe251ac69d650469b51d16",
      },
      fields: [
        {
          format: "raw",
          label: "From",
          path: "owner",
          signature:
            "3044022048b3e79d00220b5fb5908cb13264f0a10ab1faa1f9c95702c4dcb91aefa2475a02204096676422035d37f30a9fea09553d5d1751413e5a2cb60d1b9919aa33e166b1",
        },
        {
          format: "raw",
          label: "Approve to spender",
          path: "spender",
          signature:
            "3045022100da7a47dbc3c943c29f2211e139c5dc43b6c54d79d4aec205694155a8a2bed5b902202f1a885a2a6de6b705f8cfe87d6994e470c779f8bb8e6e52166c4e41437e605f",
        },
        {
          coin_ref: 255,
          format: "amount",
          label: "Amount allowance",
          path: "value",
          signature:
            "304402204051e74e9df5f2f42d4f41e3753ceed3cd98a7061c64caf7d6042de668e6b26e02204a277db67a39a5db5aee910a4086482c76e13fe39793049c40514be6dcde27b0",
        },
        {
          format: "datetime",
          label: "Approval expire",
          path: "deadline",
          signature:
            "304402204c15b30fec2f9f4724326abaa390a08ec626b4ada487d0ed3c6adb32a54da73f02205c6484d3e5ebb3d5a05d5286bc1443c69960771e44d392a16f6cf029325adc62",
        },
      ],
    },
  "137:0x000000000022d473030f116ddee9f6b43ac78ba3:4d593149e876e739220f3b5ede1b38a0213d76c4705b1547c4323df3":
    {
      contractName: {
        label: "Permit2",
        signature:
          "3045022100d259cbf0306cda1fbd842725394b29020aaa05159884cdff8c256ad87e6d55ea02205e5c7bbbbc030c2e1362e41185312aa8140802495fed2325031da2af79dde7a4",
      },
      fields: [
        {
          coin_ref: 0,
          format: "token",
          label: "Amount allowance",
          path: "details.token",
          signature:
            "3044022078ff4404d1d554e4d48af1b36b116389dfc385ed212c5ae51cf0218ea7f2aeb20220420d390f654485f830075770a5383f1f79d6557f5c9553e9006e289d4b1ac225",
        },
        {
          coin_ref: 0,
          format: "amount",
          label: "Amount allowance",
          path: "details.amount",
          signature:
            "3045022100f3d322f11e7ed81304baaee25ca2991ad339be783a3f5ff60b0fad3edad3291002201a396f507b590d56d8af66999fafdfc6aaadc75e0e2c9d558b90d5320bdb21a8",
        },
        {
          format: "raw",
          label: "Approve to spender",
          path: "spender",
          signature:
            "304402207d9c68450fd568c07e5b5ecffe29747c64d247cc1ccc8cce83d4112d029317d202206c631ddb8ea90ad75aa1339f2e966b72193758615f303af6c8f94c733f6e877c",
        },
        {
          format: "datetime",
          label: "Approval expire",
          path: "details.expiration",
          signature:
            "3045022100e847166e60f851e3c8d1f44139811898ccd0d3a03aed6c77f8c3993813f479d2022031fe6b6a574b56c5104003cf07900d11ffaf303dc016da4c1c3d184663da8f6a",
        },
      ],
    },
  "42161:0x000000000022d473030f116ddee9f6b43ac78ba3:a35a03a79619e46c3773d8880c952f7caeea45674557cfd2470e8fc5":
    {
      contractName: {
        label: "UniswapX Exclusive Dutch Order",
        signature:
          "304502210087b5fd4ca85d8d902459aabf0cfb97c676809c967b84c8a8301838f54d2f144602200d268e03f892d81b35ac1bd493310f4fb65a202c2ad2ebec3f427978756b3106",
      },
      fields: [
        {
          format: "raw",
          label: "Approve to spender",
          path: "spender",
          signature:
            "3045022100b5e936abd5df8c51ae2ee04b8f06e58162c5702083fddce3494b19c9bc9c2e01022032e9c8fdfd04c78d70d0f1e03e1fe716afc7bb2d2f643cb4586316e87a7c2150",
        },
        {
          coin_ref: 0,
          format: "token",
          label: "Amount allowance",
          path: "permitted.token",
          signature:
            "30440220125f3c8832b05bc42e224f0607516500d37871d13a417b5726995fcc2d046370022072bb072b344a1b426a8d2d80572e95bba4e3113f73e32d5da63243847068dced",
        },
        {
          coin_ref: 0,
          format: "amount",
          label: "Amount allowance",
          path: "permitted.amount",
          signature:
            "30450221008b6d55b1299546ce1c95f1c2aa9ac5587a565f8972d16af11d0818a42ab01f2e02200120350300078049199f8429ac0dcd326f17aa76890c4e5b033ec976cfab1819",
        },
        {
          coin_ref: 1,
          format: "token",
          label: "To swap",
          path: "witness.inputToken",
          signature:
            "304402205298d4af21719f53590aece55ed00ddead2c2d779e07543100d7444e3633088402205e956e92d57fb05cf467c331c59cbb067ed1f5bbf75eeaa9b1875a0970c14354",
        },
        {
          coin_ref: 1,
          format: "amount",
          label: "To swap",
          path: "witness.inputStartAmount",
          signature:
            "3044022070db1a59aa095548e0c834d7e9181d3df598f01432ce1fac9dd92f6d09d8954c022003f24e083a744c767f7b693b2f05988d57b8746750013eb4bba5071a1bf75f1e",
        },
        {
          format: "raw",
          label: "Tokens to receive",
          path: "witness.outputs.[].tokens",
          signature:
            "3044022012200dbd0f9badcb2b27407289e2f87db36900cbc885e4f5cf70def72af8a83c022042d69ea567ec837c8efd443c135b2f807715dd64fb04900d95515530373f36ff",
        },
        {
          format: "raw",
          label: "Minimum amounts to receive",
          path: "witness.outputs.[].amount",
          signature:
            "3045022100b98951b5fdd4b51aafac8ca1f2c9d186be8d52eb989f8e8b8d6937964a30e7ef02201f974191cc577b7ed3221e5dfee07aeee19bd361418c95e76589ada56b3e3b76",
        },
        {
          format: "raw",
          label: "On Addresses",
          path: "witness.outputs.[].recipient",
          signature:
            "3045022100eb5d8a309b9b9865377f4b430acc4ac5845c6b4339ce2bb9228fc76947904e3b02207530da05e41c522a6385d0cb586cb459305e98b45d32d0decc078081781986ae",
        },
        {
          format: "datetime",
          label: "Approval expire",
          path: "deadline",
          signature:
            "30450221009f9fcc4fd4ede454b777009af42cbf3ef775c25093569172de07e54cf5adab82022032c15d56b5d2168a5412645f45af3b1cfb37afe499798561e4269ff4be8db15e",
        },
      ],
    },
  "137:0x111111125421ca6dc452d289314280a0f8842a65:c4d135e3a126166bdee4e4859b77383074c8f046fb9b83e9cef7138c":
    {
      contractName: {
        label: "1inch Order",
        signature:
          "30440220295e0aeb17ca0929b2a94c324d67d0b5528aba268177f3ac297b563141e0002702203ac360d9fd0c9c0c12279d1e73bea5d549a1e8141f454d88fbe1e8ef970e6802",
      },
      fields: [
        {
          format: "raw",
          label: "From",
          path: "maker",
          signature:
            "3045022100b820e4dfb1a0cde6dc97d9a34eebb1a4eef0b226262e6788118ab3c7fb79fe3502202d426a388b4c3a8096b3f84412a702ea537770e61ee0727ec1b710c1da520c44",
        },
        {
          coin_ref: 0,
          format: "token",
          label: "Send",
          path: "makerAsset",
          signature:
            "30440220015921d09f25c9affdb99c858b4ed07cab1a8c81674094bbc35720303a676d7b02201fc7c60bacf6d32d89d3196801d5c8bed45156d6a012f222deee6aa4d9e37d8f",
        },
        {
          coin_ref: 0,
          format: "amount",
          label: "Send",
          path: "makingAmount",
          signature:
            "3045022100caf1b5544825ee057566f9adc1c9ce4c4063936114c89b2a003ae42b2df0ed6f022059c98d1dfd79b83f325cf2e787d66b18c28413c66e8d805463e077ec534f7609",
        },
        {
          coin_ref: 1,
          format: "token",
          label: "Receive minimum",
          path: "takerAsset",
          signature:
            "3045022100ff727847445431e571cd2a0d9db42a7eb62e37877b9bf20e6a96584255347e1902200a6e95b7f8e63b2fab0bef88c747de6a387d06351be5bdc34b2c1f9aea6fdd28",
        },
        {
          coin_ref: 1,
          format: "amount",
          label: "Receive minimum",
          path: "takingAmount",
          signature:
            "3045022100a59dc479a838a813909c140a15e6b65bc58c5633284bf973c436de5a592634e202201e038fc7995d939fccd546e4c85e793c0ad451216e36a4edfc7bce5be27808cb",
        },
        {
          format: "raw",
          label: "To",
          path: "receiver",
          signature:
            "304402205c5b1740d2e74513a9332e3160ebfe5996186c68141055a95d733d51eb51dff402201a1e085dcd9487bdabe9e04426cd8b043c5bf158843fed944affdeef0768ad43",
        },
      ],
    },
};
