import { BigNumber } from "bignumber.js";
import expect from "expect";
import { scanOperations } from "../scanOperations";

describe("scan transactions for multiple addresses", () => {
  it("One address", async () => {
    const address = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";

    const result = await scanOperations([address], "");
    expect(result.length).toBeGreaterThan(20);

    const exampleTx = result.find(
      res => res.hash === "d3b2d5542d8c943a90b827c4adfe8fe366c8bd8dfb5eb32627cba4b7e9a14ef5",
    );
    expect(exampleTx).toBeDefined();

    expect(exampleTx?.fee.eq(BigNumber(10000))).toBe(true);
    expect(exampleTx?.value.eq(BigNumber(1000000))).toBe(true);

    expect(exampleTx?.type).toBe("IN");
    expect(exampleTx?.senders.length).toBe(1);
    expect(exampleTx?.senders[0]).toBe(
      "kaspa:qr7muv5ywzgjkx6kj20nvp8yes4xg5dxz8dhntkn0jxm4gucuh5d2lv2nh2as",
    );
    expect(exampleTx?.recipients.length).toBe(2);
    expect(
      exampleTx?.recipients.includes(
        "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
      ),
    ).toBe(true);
    expect(
      exampleTx?.recipients.includes(
        "kaspa:qrhrdg74c6he64ydeevnsxp9c7eu3d0sct2g5rlt3lj7gzyapnl5zzf6spefa",
      ),
    ).toBe(true);

    // it's a burn address, so it's definetly an IN-operation
    result.slice(0, 50).forEach(tx => {
      expect(tx.type).toBe("IN");
    });
  });
  it("Two addresses", async () => {
    const addresses: string[] = [
      "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
      "kaspa:qqkqkzjvr7zwxxmjxjkmxxdwju9kjs6e9u82uh59z07vgaks6gg62v8707g73",
    ];
    const result = await scanOperations(addresses, "");

    expect(result.length).toBeGreaterThan(20);

    // both addresses in outputs
    expect(result.find(res => res.recipients.includes(addresses[0]))).toBeDefined();
    expect(result.find(res => res.recipients.includes(addresses[1]))).toBeDefined();
  });
  it("200 addresses should be done in max 10s", async () => {
    const addresses: string[] = [
      "kaspa:qq82f9sdsqqkr74memhxt9yrefc8vq9khf5vt6xjp4tscc3pdenmks29mlp9y",
      "kaspa:qqq7n4n232754kgw6jeu4zu86uerwn4kq9lnl2n2prwl3t2t9hvec720vk9s2",
      "kaspa:qpc6twj20gxqpeyxvgqe3v4y2ng8t0tawfax89jkf8f24wazmcreu9ggw3crl",
      "kaspa:qp09jt0gh9qmhymfyqpga38avm098nm5j2x4uz4kfxs6kyv6u0qg6z09uknmw",
      "kaspa:qphv6h6e0dv605j2vz6rwgj0e28fh4nupssfyq3msaex6w7y3gh0kny8rwhrp",
      "kaspa:qrp78nf43jaz3zk0j4dxga4ncdzk95xhun95hp6scyh6g6z7kwugy02wfw6ee",
      "kaspa:qrkacr4jtl8fznhre26rttuprqj9kz02ntks9v8gftm2ms5qjqnwqmdjhf4z7",
      "kaspa:qzu2meys866jtsl48h6wu99j9s90t8u0ednp3pwhcmmdyttdufusjsr3l2tsz",
      "kaspa:qr8ng05d4s46ayggcv9mvaxr0x8yqpv5ztw969zfye59xemp3ph4vazqt693p",
      "kaspa:qqv6t7vvgkk6nfpruwttqnfxhjn65xxdd8vjxw5nkq5zkncps6e6x33880l4r",
      "kaspa:qre7kw0x393sg3w0plmy5x3kpgtct405j7g42tnv2um72z0qynruyrc3d0zcv",
      "kaspa:qpzd6zhske64d0jvxp8kn93h5dfd2j39gj8nzdpt229l30sr8ln9jd2mjzamq",
      "kaspa:qpkq06nnt20gm66cg363uycws75tga4qkq4za4dz5s86zuky6l7m2wsxqy5zw",
      "kaspa:qqcfxdkc60fymkl5cc0fxwnhhh8nth9spsrxcn34j63ktr6nr24n7srpr2zm2",
      "kaspa:qqw80l6g0xwt00q09tlauasxnp9h0vrgwxfly28255j64rt3vvrw6m05pe98j",
      "kaspa:qrukqftcmhffevuszj60l46z7m98kdf7h9cfmtxelufvaf5xfsj86fdjxtmm2",
      "kaspa:qr4pquk0yqcvr5ldpv46stpra3pqrzaywkfn0cn9f7rkcy4xgu7kx03mm5yls",
      "kaspa:qp4laulwqz09qnrw6euysq0ae59mf9nwpkchhsjev9y8pw2f95mt5du6fkpa5",
      "kaspa:qzthpx76mw6206p3ls6j23xxvhjwrd6920djfhdte4tc09v8jqhxgtlqw80xn",
      "kaspa:qpkj88e8008l9j2h40t48570xz3u9l8y06vfqd8pwzsmnunhnd73zls5hdzul",
      "kaspa:qrhluzyhy2n5u57z7f4jn4n2fjwjcd86ewge3j9h8dvtel2c8ldmwcvylp4hc",
      "kaspa:qz6k0pz8shqd4zfpmqpspl6j0purdhwq0xy2h8serqw07cppshflcr3mhe248",
      "kaspa:qrckwt9rumxx8r7qnhaec50jjzun70nt7z5gp6jzce0x6ce7q4trvd9h2de7h",
      "kaspa:qpxd49lqfsm8xc7h8zfrq7hsepuhyxcv7rjw7uh8zdarptsphglvwyft86lq0",
      "kaspa:qqazyredarlyecvyu4hajf93rm2h7psnne9zdjdfte30z9kusmakyfqzqwejh",
      "kaspa:qr75stkhe6wwylvnhr0209j2s628ljhm2mcd98xwxtny00wt8k25slr377s42",
      "kaspa:qz02cr63rr5q5c255gym9h8wyh35nx55kzj5vsecesnnlmkx30tw50xmqx68x",
      "kaspa:qpd79h3q5n44vtnnv453vdag0jjreswm7j4n7yn9pk6z02xres0w7xtq89vcp",
      "kaspa:qrea9nx96khcenx7s7getyt383xxtp2tnqha6hckkfx2hnscrtse6kkgt5smq",
      "kaspa:qzjaa4cvngeggxppvceee23tvn45888gxs9qsye26ktmjphcfmtfsmmhl7qn5",
      "kaspa:qzuac7efd533gcrdlg9wlghagv78r0v6hr3ww5n0sknzvw6ultlpssvpw5lnp",
      "kaspa:qz3qzsg08w8eczkyn9nqcc3wvdh800cq6ef6capn5etrc78qu0m2s2tz2neqe",
      "kaspa:qpanxyfr78fx8pm5wxvsu6zjfe8gagm4nw4v38rucfqtjerclly0jdyxc0et3",
      "kaspa:qzl478lkwhmtdm779weq56grykxlljauz2rwrcclwm5zy3qwzxxa2km4nl66f",
      "kaspa:qrxlupzem0vag3nps4x7msza47kxc97fhr6kac00qwj5nhd7tqadve053e37q",
      "kaspa:qzfgltqxy8wxle0mnsalq05tg8wp5gecn0uzjm4v2ynhxdnch6fg74qsns7nz",
      "kaspa:qqvwyszx9yf457pqyywx0754cspvjsuyrgay756qeq45nzjewljrvrjr9xpke",
      "kaspa:qr9e9pncm8lr7t0pr3nx0xswf8l6afme92crt52c5y5mmz9fa4utg9ta8m80p",
      "kaspa:qpjjzjqz7gwgd0k4n94ptdyg5jly92pj2em4s6khpdgpv02u3y0f72u7rqsgj",
      "kaspa:qzgxes49fj8qhrsekskt3we4rw6tc992rdmu2k5ten0anvgye7nl2g2jq9272",
      "kaspa:qzcun67gtqutt6gv7pf3ry64z05glqxdqr0dwxyke380xnw4jksrgd72fv8qz",
      "kaspa:qrvyk7a9y4mfvh7drhktd9x9kzx9vx9cdfkks7q6qhdv2g7evm9zs8vk9xfcn",
      "kaspa:qp9cjk26a8ae950txz8t7j0h0afdxfe0ywckhcdjd63saaccr6guwc07e8z5u",
      "kaspa:qqse9s0tvwhrljrmr2pdghwpulgnw0gkxawjnpqmvgutchejhr9wgqel6qxck",
      "kaspa:qqmv8753a3sg49nl3zyt0n8ly65atszr5zjwyv7n3lywwvxd2saazych8h3at",
      "kaspa:qppvvmyppmq50h5ujtuwtzkdehwt8xzkh6qrxs3wxx20luv9kuh4k6t5hczap",
      "kaspa:qrg226fnq4as9wuf02wx0q3grkvwry9452uxfwc8nqw4nnk8fkhzxslxy5qav",
      "kaspa:qqfuf7y68llrn5lzkght0cf25058yruar48za4t2hyjpaza43fhuvyjdtf8sk",
      "kaspa:qr6ftus2rkj2caqp2qecctgmahdryt5m3mpjeygn7ef8wqhwa5m5vj3a37aen",
      "kaspa:qq6xr60ksl5hhevzeu7eyth7suyu96a78zht53s2a40ejqwjsrdrwanuc7jpr",
      "kaspa:qp3gvkcndd6z6wd2tevh2s74h5qysv8s87x3gpfhea590plysgwuw0ejazaem",
      "kaspa:qpql4yq64s0gqugplq5h87gygde62et84nssfygznnnzypfgnjys5l8rt8gg7",
      "kaspa:qpyjc7mn2h5sjcmuqjnjfzt3h2tszqtuj0kk899jszmqq6stutuvkvm5vdvxz",
      "kaspa:qqhqw2kr3a3kdrgtvv205057hphytc49s3x3kl97ds82q8w697x2q0z5mke9j",
      "kaspa:qrnxvsppuycam7n8c87ekew82m3y6r57vt4vepegx7ja0p73mhzzvyl5x7770",
      "kaspa:qq7h72uqm9d3csdrav2hlam5jnqclkc2mygkk8q3f6zcya6stzqrw3tp2utdd",
      "kaspa:qrgjc8sz4nv2qmyagct4x0qfjf8sxazlgzs3gq23prxd8r8tm9h27jzgcmjlq",
      "kaspa:qr8pyj8nvvshu7yymwh4zt00d222gqlgsk2n6ddp800pwxv2d72kqu64tldr8",
      "kaspa:qzh9udxkshws6678apcr0282znk8fe9c2vsnv7f0sgxppyt2w0rg7ql8tywyr",
      "kaspa:qr94vw4t4kucmmqfwyrlqhjcwtc4536l4jnxvje8lkrurs2zx6lsu4h0skvfs",
      "kaspa:qp9kcauqhsk3kup3e346yqgrlrgyuh4t2zslw3x4rdn4zu4shk52uasl909s3",
      "kaspa:qrq8jee7pxsr77wjrplwdh40szatgwkqav7w9fvadw2lzxpw94huwnz29vw4d",
      "kaspa:qrl7s4vmfnxueddyny52ff6p39h78jfwth7j0m7zcl9ywckjhssp2mkwfsjru",
      "kaspa:qzj8kap4gh3drrp285p4jgpxacny8273t2vle40n2u2cge8el54cvzrkz0yqy",
      "kaspa:qp3w6yf3splzsjzr0v7yrfrytvm39akfyjjpv4309esl9cts3qvnqwgwp9h3c",
      "kaspa:qp7drlexrjgprwz2em5fk8ghszfucff0xfgswstt58sjv43r2r4zvf7qsecys",
      "kaspa:qztlqfc7repxpme3e40cgsde70pfc2ncj49qqgmqn0z84c2pxyzh7h9rmpztt",
      "kaspa:qq8sjfdqk8p4yg2j9fq34t02w9p9l84auv8sag2hh5ueqrtjku897p9zutw98",
      "kaspa:qz05nclqtjundyhj804dp8n5fth8gmhst874r8d0gs9yqzeu2q6ushh95vmc6",
      "kaspa:qrxq4rh6lqt6ld6sllqrvm2zylneprm7lwzserfzq4g5y830mhy2w6cpu977n",
      "kaspa:qptqzn45z6m4tx4v9uev08j9zdwndr69cg922ennd369lq9akrj8qczmc3nd8",
      "kaspa:qz9mnll7tev5k8gtkkyph6v2zpdll3z8nptkrflvj63fkdmjdw57klr7xgym3",
      "kaspa:qrumca7wluc6g2sy06lq6h26nzmk8ax4u4r96l3xfg3hyfvtq0n7cn2nupahc",
      "kaspa:qzsjs2zyyc4x2hsg209c8rlqsnv94p23kkrfqkggjtsrhqs6a7vjzve4fku72",
      "kaspa:qquevls9j5x9sct862ee8pygrhhvl5suaghq72yep4a0ct5rjy73gwe7n4yjs",
      "kaspa:qpp4c4cz36grtqgczkhm7wpvd05n0c80d5tl5chkra2avxplden6cexc33zzf",
      "kaspa:qqqdxdvx5hgyr3nvdfadz334xy5fa3mjm5xzf69f26c0thc4p5jzssse4skyw",
      "kaspa:qzp2k48jtp9s58fquwztdxtepsrn8ft9jw4nd9flky6evqz65w5v6jp5x3gta",
      "kaspa:qq0t352sse9jzg3lx47fakncqf6rne6tjj8jkdjgag9ywumcpdc3kupsar0vy",
      "kaspa:qzw4q2pckhjxc4rqxrwctcatg8tva7lxcpaqz4j7z9tqldkjj7dr5rrlqd65c",
      "kaspa:qqr4c220c43qn2hyw5kckltu47s6y0yexfkl8fm7gsjy32vdgejgc249mrg9l",
      "kaspa:qqv5rpq5vdnllaprhgcrwcgkunar62hv57ktprycpnuy86rsclwugwtx4yega",
      "kaspa:qrun5qmv6ltd58wcs0xmdz3se6dscz3h4nn3uz4k5rs0qyyfwr7lcqce6ey8h",
      "kaspa:qzljej9sd2t4v42sdqq5gk4q80k5pf4prxdt2gvfchyflg4z9x8n7fvdgv77x",
      "kaspa:qpp0rw7vh6dznckgp265zmf47ayrfhs68jdhqgef5rl96cva677mk2h097emm",
      "kaspa:qpm6mthdcscpnwgh0j9d9t60v7v0f2k6u5qheukhtd2qpqatgfwuzdz32rgk5",
      "kaspa:qzclwgz23ug0xr30awczk5gqelayu4q7cvl36lzu9t625ru2mtt56l5sycr3e",
      "kaspa:qqpr43scd370hgs999nmmfx7pwesvrcq6qnqh9cl50y7asq7fcqfcdkxh9r8z",
      "kaspa:qz9nywkf7vft43putw9qjne0s6eacdqfag9ah92fkfguf5q8yk7fgj6jz9vfv",
      "kaspa:qql0fs9rv9leawshms8jea8v3ch4j82lmxjgj77rmzguxkwlg4hwz33ju3vas",
      "kaspa:qqzj67duym3h2skdz9n2haelzv4gkavc3pl2eutxz225sgugffu7ck3mfn8ve",
      "kaspa:qqqcgwnzf2cqtrgs2a7udeayhpcwrel5d3qsd646w8jajdz0pvqtvx6zzdxmw",
      "kaspa:qza6yw2su3zsh82amr8s89lt003lvcnfryha7vkn7wwdgnw5npswkgherl6wa",
      "kaspa:qpfpkjkgvtt9u2gtl72e0yvk4vzvm4j48g823c9wr7yc5c4l0d8auvyljlm3a",
      "kaspa:qrqkn8rs0hnpl7ggr054kwavq5lu7k60p20ulgjtj5egcmjw9vluchvfxf3ge",
      "kaspa:qpmud4tdjme3qk8k9zs38qgp4y0l36ct08djkfjknpk2uvaynpsrjtuelgnks",
      "kaspa:qrtwtddf4um3y3kzpxr4nh9lht592vsr50ph4cylwkrxud09kmd0vk0ujrxkm",
      "kaspa:qzgkxgr7ympyf6d5xsn8ql4hvahusjvcfeue84el0lqc78mvkn8sz8edx676m",
      "kaspa:qr094kj32d0gsf02wg7ksqht4jdnlsu3n9xmn2735a6782r7q25ysdu3hrlry",
      "kaspa:qpnqgnyleagnessetj640yqx4upcvwqk5ul04759ev5xpfa8scgrkrcqnvdlz",
      "kaspa:qrtwtvc3w6uw86p2xlfq472w3gjuwrgcgmaxlv83yus9qkyd2nx0uxzl2up24",
      "kaspa:qpe75h776rkm7dv34gwypy2r4m8pr5taq3lsqs5pv82t59rct62sjgjtd48u3",
      "kaspa:qztmz0wage5gwpvgpyh6q6epnfysrn53prymjdp04fzeeuqwxa7xgm6l57kkq",
      "kaspa:qzlyedvy53essuj4txq584mp3qarv87ma4nxwvr0qeequxky3apy5q6c2p8hr",
      "kaspa:qqs4z7k6c4xd3hjrn9d5kv249v9xrlax48l36lps27c87uslwpzrztdp9qlsc",
      "kaspa:qqpsqs75gx6jrf4aeap8azqlf0fk5elgtl3a3u49y7hyx0xu2mjuc8lurl48u",
      "kaspa:qqyf0l6cyf4sp02p23nsdr5fhjm6509l3tva0mnm2edthc46jx7tk3y8jfnpk",
      "kaspa:qp6lzpu3tp28730wj9k8e7n6ne388e974ljql6fgarkqm62h4lvdv0ax63r58",
      "kaspa:qrmzm5ujkgxcvrsq6pja5klvczvkjvj4wfsmxee6j75wqtcm6avlv7a9d78tr",
      "kaspa:qp0l40z4fke7w9c8j38cpczzv02dxvhs6umg7agv9zksjjr7c2lgj82gs4r28",
      "kaspa:qzeu8hhmrr7vq3hgjffuda5efvl2588vrgm3zw56px5lpprrhkadx8h28ls7x",
      "kaspa:qpvng0ctxzt6pvlv8dt8ywmv95c0tgruu4hm58csjvenhm548k3l6xv4dt86j",
      "kaspa:qzhpznejx27luzqr0gcr9sw9l04ume2rnzt89qljq98k325uaa2kysjvtmffs",
      "kaspa:qq2l38rndh20llrfhq7909g9q6hgy8ugd5twnt4k53cv76xp55qa5g945k6c9",
      "kaspa:qqwxglxmj255mt39frju9ygr3pkq0ls48qwqwhuckan486dqr65pg9l8lx0r2",
      "kaspa:qq7cqg7u3jqjejn7j8dwryt4r89nx4vn2qzja43t08e278w9f4wu2lxp07gvx",
      "kaspa:qrrs4fu47vrz5qeu0sdf5l799wdqe42gh7ud6gknxu58rd4l8wwu28v0yswyz",
      "kaspa:qq77ykx8r7ywjswupjjqkgqfj7tzrhvs0028eaaxfjp06w54h8y3smmvx2jgd",
      "kaspa:qp3a8spx3nuuqmnf0wmzts9gvyf9zmdlkhh2ys5s0a8d3x4hcqs2vw5j8v5d8",
      "kaspa:qzcmf8da7hq0hynk5cwsvd4zenualxz5um2vn2yl5c0vsjt65whwk2q907jm7",
      "kaspa:qp8kyj003efdaamalrzx4ehj94k02y65n9e8m7vg5mcc3ps80t4g5wluhavd4",
      "kaspa:qzdgflrghdjfn8g52eh2l4drhjz90dd4r6388fud8lc0f2n58l9j6yt7xu0ry",
      "kaspa:qzx3wm8u5g8l6esdnx39s3a6q93jnr9e4u7hzj6cts2smdqfmgfuqapgvpn5g",
      "kaspa:qrwzjtmapz2lmwnwxa36v0ge8f7e9zn8yttejgkrsz4vdztqjv6s25087aplj",
      "kaspa:qqylrf2efvypx8ettwwn9l3cc52u858wg83lgwt2d7n9m9fxzfyyg9adrhqzg",
      "kaspa:qppugu8ej89sx3pkqad5s5kpf3pdj2v9x3djg0gq3fyelys6dntpuslmkhktz",
      "kaspa:qpwrlkv037jqwzt0r7t00wdrkpucw42khkvaf7a7clegr2hlfvakydrs60403",
      "kaspa:qzn24n5ezdpszf299y72up5d6xnxmezhkdrzp2f3rfg745ud0plaxneun82ze",
      "kaspa:qp25cka05xdqqntrdvkqjf9c76e6trdefnnwf78vtqnt5rrg2p44cf4rseau8",
      "kaspa:qpq2y4r9lxnxm0edalge4c7mrpmnzfk8vg65c9dd34rha2pl9y59jhakcxpcl",
      "kaspa:qqlg0495ywc5kfy6rym3xz84qdgzfayd0v03x63phdxjnx9uep6dv6g29lqlz",
      "kaspa:qrsfu838gepvxwuemh48ewcc2dmhqgc9kt0ak9mfd2m35dk9ln5g74vqxqua6",
      "kaspa:qpcmj42f0g33caeucvxw3zq6gz20n4ymwrt3w5z6qn02zma2luak5eklrslr3",
      "kaspa:qqu2heruuz73r66vrq6hmrvd35uyhcku8cu8350wcs8wwdevvremvgylr405e",
      "kaspa:qz8qlvn8y60tv689gdswfy5y63e8u2pmt59lse2et3y0rykjc9g2vvqf9a04g",
      "kaspa:qzhrnre645g985039skdqzll75m53wm0q2jqp33rz09x7sglkhr6u3ygyh0qc",
      "kaspa:qza3ysuuh6md5xqvfp0c3fmm05xlne0xupt06wgnaz0fk7nkamak69hcxe4j0",
      "kaspa:qzc2rk5r4qzavpfacnaq2scu6py6ktr8nm0gmgvlcgkckcs5fu2ccu57n83ny",
      "kaspa:qph7rnh754cxxzpzd0yfrzthnyjy7s36dtx38j4ykagr86ynmawm7g4k6yrwy",
      "kaspa:qphjrkh03x8uz8pkrq3hj9pn3hcp7k69my7dd7ldkkn65m86an0f7dsyut750",
      "kaspa:qzrats3rvpnk0qtdupk970ljdtscwtkuqgeqs2euuyrzs52gplwlsln8duyjf",
      "kaspa:qrxqah0mksm588ekdrktznx6sy6fldkg08xvvh77gjwhxdh6u370673qqfadh",
      "kaspa:qzkm3prjkza8f4z3ls2dznpcd4a8unyhnxx3rctqjfxykjzt54v4zhujk2fa0",
      "kaspa:qq069pdx0pj4a60l6v7gx4hm6w4k3slv6u7mvsymrlmq9dkpcnqdcmm60qx29",
      "kaspa:qpyh7myg6r54x44twkyxhxcjghrwj7wugz5qaj8nnxvlufyl57j2qja6a6r5h",
      "kaspa:qqswcde0dhm05gluhkjrjhd6pgelrc0m0evse0f95hmq6e5yj8yrjsgd5hge3",
      "kaspa:qzfj0luty236ew8jftmldue6p95euxne8t6e4tl88h6tyfddrvzy50pjaz43t",
      "kaspa:qrsw7u04da83wadey7tgnwqstzw8yc6xs8n3rvtug6yf0wgdrnxsvvqdn5w2q",
      "kaspa:qqt2tawz5ppt9g5xcfg53um0j2y44dtvsqccvelluj7ex36xlh0vc2kvkq9w8",
      "kaspa:qqgs536m0y82tjxc7vjldchw60g0dnnj50hj4x8vhnfvnrvz4fa9w36afffpk",
      "kaspa:qp37ud5q49nfv5n6q5ncmp5sm3crj9qzvu0agjap8qzy4h2un7jqskyu5g8xl",
      "kaspa:qrw85jr9hjh964emq82qlfx5t5c4c835hldrnep546f27d5je0c574vc5ekll",
      "kaspa:qzadqur9n8xhf3ekf5u504h790qvnqmzq4v3xrct2vukgvkkqk7fqnjxel40h",
      "kaspa:qq4jf702j4gxld9xudvt84gyp74ram7gmj6z6lnu5u5qh75kpxnc7q8s7yktp",
      "kaspa:qrvn70c8l4mrhnrcrsz3jlc5eljx98hy47n60kh32pg39y5vu69qwh8p4qxf7",
      "kaspa:qqn9474tyx9u8kzrkjjdchnajnskx02mf4w2j8n0mxwchla4ggvh609nskw4p",
      "kaspa:qrn0j8qakx8wevnjf6tr4tvv29usaqa4r22p6ffkdjr8q9uhm8537ftf0wg86",
      "kaspa:qzdfpv7rv9rwygjs6qxsvvpwex2frrkk6gaggh3k5y3fjea7xlyxg3mjus6df",
      "kaspa:qqdk2qkuksws4pd5cpc2ptrjtyxtak82zuur7vy3tgesmd4cjxlxwl3n5zm0e",
      "kaspa:qr5u6578pl4yyf974z2crzynt8nd4njemknpy4rfhgp3mmcf7fz5xwhwsja3l",
      "kaspa:qqxacd427end7se2af24d20k9w8hlnheyncr9kt5m7502lxd8jjgk42z8s0la",
      "kaspa:qr6a8y02jlmhqfa92spfvunsz9g43ldmfxu43k82a2nm96arkh8tqqfrvn8xt",
      "kaspa:qzvtx8ya0l6k699778q2jhxplcwf7k3hu2jrjx25hf94gn8249n5yxmrqa0ll",
      "kaspa:qrpkssan7wldkf58n4a7suthej0xy3wxxh2l94k0fh4ch8wspu80y5gc6def3",
      "kaspa:qrsgmuzyssts382pjrd9wyxv8cw382epv7g6r4tjfvdku08drt9wwa6hsdl5t",
      "kaspa:qpgea4rh2j3c07n9exp72dn0jtqhzap5ja0363dvagkdtra3jnpquugvhkgwp",
      "kaspa:qr5py6ja7vncn6sjqty7080yqmcfneagu4gcr4df4wwpldmjezm0sase89p3t",
      "kaspa:qpntynfnsfh2m3jfqp9a3h8huw6hal3fhg22lz476078zpg72jumsk4z0gfan",
      "kaspa:qz6s474wpm75kpfm4695nzc8pxt4a6zgrm4c8krn9xts08m9vha65jmnlp0fh",
      "kaspa:qzjqhkwdnd5up8ae8kv9zde20zdznae2cevjpvl0t72w6dkan82kktalk7j3t",
      "kaspa:qzugmqvh8fdddwjakq6ekq0s5w2hcdq0mtqszlaw8re0mgpk0ut853jc8fdd3",
      "kaspa:qz8tervrrcrkqqv068xkjaexg8ntdzg5kfw5a6reg3y5qz0a3fpyyw8w4ssmd",
      "kaspa:qqjlvpc6amqc7cqg25qd2wq0k2ynqkw3lks9wgtwlzuhuskhzyzjx0ffrv8rv",
      "kaspa:qrcvhjhz2fspgclkfr99jhapaa7a97wy0j4sqdclekrpd5344w2vggvfxxzkm",
      "kaspa:qpwtxpnqpu3xwf7zvt5gt8vzdr65hy4uz6tu6l7xs8z9zwc5ef9dkt6ydttkg",
      "kaspa:qzldw8a5sq2c9wks6vlsgcrs6md3mcv02plpusrdea29dpav04mujzdhqnvnd",
      "kaspa:qpy6ukaragdej9d9fgzc4sgp52yj4wz86xyea28fyppscvyxu2d56ezy0337e",
      "kaspa:qz0nvkyfny03uksa5hzsf2gde5l6w0de0e0al4dkq470ydnrnhycvz3e6mu48",
      "kaspa:qq0e44ty34ptgdayp970wyr5r87acx5rrj6x4dfrkfnq3s5ckdk4ukfw6rclz",
      "kaspa:qrkwctpx3etm6fj8ezpdthv7whjc0299wp0swsgvq4dy737pp9klxayjynt3e",
      "kaspa:qrm4yy0kwtka3p2w8l99a89x7szms0wmrmrm9w6m4cvqsf2pd3gvqys4yggf4",
      "kaspa:qpprr86eplnhjc7xqschwsezemg9h4spg99jjpp35x7hpj7z9ghzsu9jjwht7",
      "kaspa:qzn4fxufqepttp39xrk9372csg8ncc4vll35r47nnrf2y5unmd5w2c3ly6rxr",
      "kaspa:qp5fn95zaxv4phas2yplyukazhf8h4er2rq3s93ekyggqkhah55mcpptrrl7w",
      "kaspa:qzkeqk7umrua236p95hgndxh3h4ttd0hq3hnp07rmzjn7p2ve39nwmww0ev3v",
      "kaspa:qpz6f9yk6hp86y36cn5magfzp82sl2a6rduwkmwsh5d8xz2ax6mrgghtsw235",
      "kaspa:qr5wxqesknvq7kyd4jxl9alvcr8ujhcm8rka0ru08rv6cu0lqrht2l4yx0835",
      "kaspa:qqyd6c7mg2jen8gslpsgplc83cs3xvj6wszt3y9se884vm2kpgcwvdmr9radm",
      "kaspa:qrmncnwkphzjjl88yzwc3290a96cct5ykaq6322q5hxd6ndxf7phvka9duxf4",
      "kaspa:qqvcqxrma8a5jkmwpyy2ww5ppug3gfz59wncf425m90lcmsaq3hpugqgsw005",
      "kaspa:qquzxhhrlnz78p2t6xh54s7rkgq9s9x6ule2fqa7mc98dtweaa62vlexrny75",
      "kaspa:qzgvtxcs530rajt4a5q7vkehflr262qcn4g3v2f3ftc2xvnh4ttskl62q6h72",
      "kaspa:qpj4c9lcqcvyp0rp3zflmet6wa2xfrn0lmsaqkf25z62u8wrj3sjxyhshm4an",
      "kaspa:qr5fxj66y4d0awa86uuqucpr3w6m5qr2qdltvjffr2fwac0weftvyccrsr8f9",
      "kaspa:qzzenq947vfuhw6k3qtjytrfryarn6dk22nt6plnvx6df0k9nuuj2dzgq3r0l",
      "kaspa:qq0jjczfdth4nhmlavradh6jl3ynpngkdmthq9fafsjvm523f4ef2tmca6d60",
      "kaspa:qqkqpu3s479h5pzhumsz9nt860veltj4xcgz4nr2gtcfezdj0x43g2x3zv69l",
      "kaspa:qqqg5nn63rusalr4w8qatwaxghjce274y6lcdcgpppqrrpq8raezvxnlr9dz2",
      "kaspa:qp7he2r07njf6a9l9kc4ensygxl0ydfqqp8jfx5l4a8qehnhmr6pvswfcz3ld",
      "kaspa:qpy2dzp9znrrwqsmxgrj3glqy8dz7nyg6tatcfuy5ku7srkryju3gpmwuar8a",
    ];

    const startTime = Date.now();
    const result = await scanOperations(addresses, "");
    const endTime = Date.now();
    const timeTakenInSeconds = (endTime - startTime) / 1000;

    expect(result.length).toBeGreaterThan(5);

    // both addresses in outputs
    expect(result.find(res => res.recipients.includes(addresses[0]))).toBeDefined();
    expect(result.find(res => res.recipients.includes(addresses[1]))).toBeDefined();
    expect(timeTakenInSeconds).toBeLessThan(10);
  }, 15000);
});
