import { DerivationMode } from "@ledgerhq/types-live";

export type AccountType = "big" | "average" | "pristine";

export interface AccountInfo {
  address: string;
  xpub?: string;
  derivationMode?: DerivationMode;
}

const info: Record<string, { accounts: Partial<Record<AccountType, AccountInfo>>; skip?: string }> =
  {
    bitcoin: {
      accounts: {
        average: {
          address: "",
          xpub: "xpub6CCc6taSdhLfwHhSyrkHh1fc2CgvDAbezeM5wunWfs7tCH26ysNK8nvoyAzBTBM38NbYSFehwwnZRAYHkBB9JM3gC8eJ2n5CNJgjX7Srdse",
          derivationMode: "native_segwit",
        },
        pristine: {
          address: "",
          xpub: "xpub6BvBDx9oswQpgmpwbMi7BMU78NNYe6b9ncdmmVA1LBXirjmHxzM8zgChZiQcetvk7JZJ5AAqgYgnupnPfvenXFULotGQxQFz36P2T8XZzsE",
          derivationMode: "native_segwit",
        },
      },
    },
    ethereum: {
      accounts: {
        big: { address: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52" },
        average: { address: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3" },
        pristine: { address: "0x6895Df5ed013c85B3D9D2446c227C9AfC3813551" },
      },
    },
    solana: {
      accounts: {
        big: { address: "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S" },
        average: { address: "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp" },
        pristine: { address: "Hbac8tM3SMbua9ZBqPRbEJ2n3FtikRJc7wFmZzpqbtBv" },
      },
    },
    sui: {
      accounts: {
        pristine: { address: "0x285836edd88055191e2448ac81d00786dc33de570bcfdf96fed3e39747449fdc" },
        average: { address: "0x085f6362077282f861abe75151ba3ec6df1dbb82291369f9a06da135ac156c15" },
        big: { address: "0x15610fa7ee546b96cb580be4060fae1c4bb15eca87f9a0aa931512bad445fc76" },
      },
    },
    polkadot: {
      accounts: {
        pristine: { address: "5HEDGMG7mYqh18Xs4BZpYZ3u7EPWUJ8hPDTJhq3cDZh1ztRW" },
        average: { address: "1zugcabYjgfQdMLC3cAzQ8tJZMo45tMnGpivpAzpxB4CZyK" },
        big: { address: "15K6nb2qhMorgiaavGZPPKCzcyrWFiWaSZM15UjqEn8C4yLn" },
      },
    },
    elrond: {
      // multiversx
      accounts: {
        pristine: { address: "erd1s4pulht4wn96swcwel64624l40h5lyxfnl9cejwy27kvwvqayuvq2y7klj" },
        average: { address: "erd1trwn89w64n88xhl76y8rfzj4r59h2fc8u03mg0tzjh8r3lmwq0lsa3q0yk" },
        big: { address: "erd17l22xekj5lvfulatz20xr0llxky6c8zr923r95qg3pfx668m862skjdveh" },
      },
    },
    filecoin: {
      accounts: {
        pristine: { address: "f02901126" },
        average: { address: "f1dyqj5drgs4jjjkhddix2pptiwg2cjioyv4x4gli" },
        big: { address: "f1khdd2v7il7lxn4zjzzrqwceh466mq5k333ktu7q" },
      },
    },
    mina: {
      accounts: {
        pristine: { address: "B62qoBXNhc6YqTa86zzniBjNTyshkM7NjGf1Z1uBJJXjSTdYK1qyKr6" },
        average: { address: "B62qja3UzWbWrJU6gHbdASQyVdMtxcGwPhxaWDiSrT6892ovCqsR6f6" },
        big: { address: "B62qoErNk7pK8BPtbx1eKoa4GURxvyB65hJNXmeRyk56TeB26zqosvw" },
      },
    },
    hedera: {
      accounts: {
        pristine: { address: "0.0.433" },
        average: { address: "0.0.1000" },
        big: { address: "0.0.652978" },
      },
    },
    aptos: {
      accounts: {
        pristine: { address: "0x404ccbd2acb6208effa69c100849feff040cec697d06f745152bdb3aa3a70614" },
        average: { address: "0x201cf09644cd5d88aa6db2d1670011325eea2c3198ddfd0c1aa549be0003bb24" },
        big: { address: "0xb8922507317d85197d70c2bc1afc949c759fd0a62c8841a4300d1e2b63649bf6" },
      },
      skip: "403 issue",
    },
    celo: {
      accounts: {
        pristine: { address: "0x64947cDB38d9d364eD5Ab78bfa23b29DE2ecdF7b" },
        average: { address: "0x709fcCB2141EddCd95A4d618e82a9E895792055d" },
        big: { address: "0xA5c453BC33FD9C5C798Ac24F666fa2B49E0a87fe" },
      },
    },
    algorand: {
      accounts: {
        pristine: { address: "JHCRLKUBKMRUUHJFYCBYOVQRTSRHSSL6P376LNDQJSVLM7IQI2EUH6S4ZU" },
        average: { address: "EZ6UMFSEAURIYP2E7KI4BUAERRASJM233XLFBO3ZOQYOQOHYL6FRPTYCEI" },
        big: { address: "KJOLZZ55JVCXTXDEVFSPUSKGP7SCQDEURMAMEBJEPXRLIQBQDTVD4NO7GQ" },
      },
    },
    near: {
      accounts: {
        pristine: { address: "test-pristine.testnet" },
        average: { address: "nearkat.near" },
        big: { address: "relay.aurora" },
      },
    },
    cosmos: {
      accounts: {
        pristine: { address: "cosmos1cc3h49u9thwtvz4rlx9pf4kwycczx36q46rp59" },
        average: { address: "cosmos1gs72s636mzfnc0re2qrvupz0daytv4057y30g6" },
        big: { address: "cosmos18ejqp3d6yejcq3rxj4z6fsne63uj23cykw92pp" },
      },
      skip: "invalid url issue",
    },
    vechain: {
      accounts: {
        pristine: { address: "0x5034aa590125b64023a0262112b98d72e3c8e40e" },
        average: { address: "0x23a93f95b5bafbf063cf63a129deca068de23288" },
        big: { address: "0xb0894ec7992e2ca4322dbd2eb99fa39448fe2d72" },
      },
    },
    icon: {
      accounts: {
        pristine: { address: "hx4d932cbcffcc95fbac52fcb388fa20c868673a96" },
        average: { address: "hx2124c477a48c589f377aebfd8028bd4a8d7c0d2d" },
        big: { address: "hxd75467e3e4ce64e3424c747dfb71503017440433" },
      },
    },
    stellar: {
      accounts: {
        pristine: { address: "GDO2OB4MWX4ZHDFGEHDTV6YB5TZY5MT2F5HEJ7UYR2JY3NTNNDOHA7AV" },
        average: { address: "GA6QQ7GWNAH7CW42IWV653UAERLQH3G2FDW76ZVL6KWJEZ37JTFH27ET" },
        big: { address: "GB6YM6S6NW5UDYQASFDFXHCIVLY7BEPRLYVUBXWME6K7YZKKA4VE2Q7C" },
      },
    },
    tezos: {
      accounts: {
        pristine: { address: "0082c6dcd37e14f83e852c8d3d21bc39289598f94cdd5800f6e4a9a8a5adfe3beb" },
        average: { address: "0019b730b7b55718272cd409ca3480ff07c848579cfa65c41a57d50398098c50b2" },
        big: { address: "007caac43b092bc041b15ca917c63ff7e721db93a16ace333c834fdcc1000884d2" },
      },
    },
    tron: {
      accounts: {
        pristine: { address: "TKttnV3NSMA8AqZKpnjFAUFsWsAGdgT5YG" },
        average: { address: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7" },
        big: { address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH" },
      },
    },
    ripple: {
      accounts: {
        pristine: { address: "rMQ98K56yXJbDGv49ZSmW51sLn94Xe1mu1" },
        average: { address: "rPdvC6ccq8hCdPKSPJkPmyZ4Mi1oG2FFkT" },
        big: { address: "rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY" },
      },
    },
    casper: {
      accounts: {
        pristine: {
          address: "020319d3ace178361daf4a2438faa00ccacad7bd531c93173c1fc30ecc8173ef0f76",
        },
        average: { address: "015febf058ea3d58e62363c0f5b546d4cb1a4439fc439dc3d333db192606e6defa" },
        big: {
          address: "8c15bba2d147859c7b7a8f43028eeb4d3c9571c6e36dfecc97c77463d3af08cd",
          xpub: "02024c5e3ba7b1da49cda950319aec914cd3c720fbec3dcf25aa4add631e28f70aa9",
        },
      },
      skip: "xpub issues",
    },
    internet_computer: {
      accounts: {
        pristine: {
          address: "020319d3ace178361daf4a2438faa00ccacad7bd531c93173c1fc30ecc8173ef0f76",
        },
        average: { address: "015febf058ea3d58e62363c0f5b546d4cb1a4439fc439dc3d333db192606e6defa" },
        big: { address: "015febf058ea3d58e62363c0f5b546d4cb1a4439fc439dc3d333db192606e6defa" },
      },
      skip: "500 issue",
    },
  };

export default info;
