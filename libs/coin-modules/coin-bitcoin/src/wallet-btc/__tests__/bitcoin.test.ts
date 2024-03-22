import { Currency } from "../crypto/types";
import cryptoFactory from "../crypto/factory";
import { DerivationModes } from "../";

describe("Unit tests for various bitcoin functions", () => {
  function testAddresses(addresses: string[][], currency: Currency) {
    const bitcoin = cryptoFactory(currency);
    addresses.forEach((pair: string[]) => {
      const result = bitcoin.toOutputScript(pair[0]);
      const actual = result.toString("hex");
      expect(actual).toEqual(pair[1]);
    });
  }

  it("Test toOutputScript", () => {
    // Test vectors from BIP350
    const mainnetAddrs = [
      [
        "BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4",
        "0014751e76e8199196d454941c45d1b3a323f1433bd6",
      ],
      [
        "bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7kt5nd6y",
        "5128751e76e8199196d454941c45d1b3a323f1433bd6751e76e8199196d454941c45d1b3a323f1433bd6",
      ],
      ["BC1SW50QGDZ25J", "6002751e"],
      ["bc1zw508d6qejxtdg4y5r3zarvaryvaxxpcs", "5210751e76e8199196d454941c45d1b3a323"],
      [
        "bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0",
        "512079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
      ],
    ];
    testAddresses(mainnetAddrs, "bitcoin");
    const testnetAddrs = [
      [
        "tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7",
        "00201863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262",
      ],
      [
        "tb1qqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesrxh6hy",
        "0020000000c4a5cad46221b2a187905e5266362b99d5e91c6ce24d165dab93e86433",
      ],
      [
        "tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c",
        "5120000000c4a5cad46221b2a187905e5266362b99d5e91c6ce24d165dab93e86433",
      ],
    ];
    testAddresses(testnetAddrs, "bitcoin_testnet");
  });

  it("toOutputScript p2sh and p2pkh work as expected", () => {
    const p2pkh = [
      ["13wuYubzsKiGHm6su5BJQ1PdWUitkJV3kE", "76a91420529483bd2a346c0e09b032b7a31a574f2a0d5688ac"],
    ];
    testAddresses(p2pkh, "bitcoin");
    const p2sh = [
      ["3P2B3M3R33mAYX3o2ic7PdT4MM6McL2anh", "a914e9fa27cc45abc468e59bb54c66143099dbe4d3cf87"],
    ];
    testAddresses(p2sh, "bitcoin");
    const p2pkhTestnet = [
      ["mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk", "76a914ba27f99e007c7f605a8305e318c1abde3cd220ac88ac"],
    ];
    testAddresses(p2pkhTestnet, "bitcoin_testnet");
    const p2shTestnet = [
      ["2Mwp1inKcSNWSmai2giKV4YBvYiA3253cky", "a9143213fd5b1fa0d58e0a9be31fd5095a749c186aa787"],
    ];
    testAddresses(p2shTestnet, "bitcoin_testnet");
  });

  it("Test taproot address generation", async () => {
    const bitcoin = cryptoFactory("bitcoin_testnet");
    // Test data taken from project app-bitcoin-new, file test_get_wallet_address.py
    // Also generated using eg
    /*
    ./bitcoin-cli deriveaddresses "tr([f5acc2fd/86'/0']tpubDDKYE6BREvDsSWMazgHoyQWiJwYaDDYPbCFjYxN3HFXJP5fokeiK4hwK5tTLBNEDBwrDXn8cQ4v9b2xdW62Xr5yxoQdMu1v6c7UDXYVH27U/0/*)#yxzagv5q" 100

    ./bitcoin-cli deriveaddresses "tr([f5acc2fd/86'/0']tpubDDKYE6BREvDsSWMazgHoyQWiJwYaDDYPbCFjYxN3HFXJP5fokeiK4hwK5tTLBNEDBwrDXn8cQ4v9b2xdW62Xr5yxoQdMu1v6c7UDXYVH27U/1/*)#4j8u4eyc" 100
    */
    const extAddrs = [
      "tb1pws8wvnj99ca6acf8kq7pjk7vyxknah0d9mexckh5s0vu2ccy68js9am6u7",
      "tb1p6evrfq0pnz2wvvptph8zvrye20aad8jlsmh2rr02rqgn9skm4hmqks9rnm",
      "tb1pg9rpfzdy8jm8utry7w2zwfuwm5cvq0tdw2jt3xvxz37y9rcvchcs5s74m8",
      "tb1pa0f2erxvuzxmgylz6wharcyruz8ajvv9xpr493uvsa23jcy8h5msdxzr9p",
      "tb1pdpyep8pzmyju92akjhq5qcskhmf066z82fxuvsm576lt90c4nplsacnv8l",
      "tb1pn6sudpw5rrcnsgxffuxdejdmjt8ynhw3rz3tp4s6pvkaptcruuhq0xdjuc",
      "tb1phxygx7zz7eem5j6hsdqryqtw4wxng0dg43cw6fa2nylekn0nue4qtw8k2x",
      "tb1pv7ky89tzcusgc9af3fhcst92a59aydkguz5knh7gstzxpflfxhusgsms8x",
      "tb1pvvphx9fqd2dlxhz20uz7uz0vpv6fduzqtvje0tx8hlwe5w5e3mrqsxawpl",
      "tb1psl7eyk2jyjzq6evqvan854fts7a5j65rth25yqahkd2a765yvj0qggs5ne",
      "tb1p6ptcjrr5v7syesfmf3a2pzjdh9tkhuce23s4kcjmqajf5w6h2r2qjsmkvh",
      "tb1pjfqqhlldx3fw0y986us2eks6q8tlpytryaelt42vakjvauuqwcgq32z5he",
      "tb1pkzphc0kn00rj6s4hfv3k43n6cj6ypy02zxa5yx7vn9v72qqyvpcq0zspxt",
      "tb1p9jss55qeaye4umrr80as6mxjsqnjrjh097e0skmwnlgmpqu63hqsf9z2w6",
      "tb1pgn2tff325nf8v7wdn90acg5stlfw9qus3r43ycswm3uetlxhlncqkun2v8",
      "tb1p0v0ycmd0lpjppvfgyv57m07czs0l20c2vzw9rm48uag2flrz8z2qyhl9um",
      "tb1pcf9ea0z3heqhr80e6sdc6fmj9adkcx0whn3fhwxr05d2suhutuhs3lc9z4",
      "tb1pws4jqxg9493jv9vxzuf82gafgghg8kvdjp9ny3unh6ztxxm2x27sqsv5la",
      "tb1phfrptqlqg9xuyvq74e7427gljltpug9mrujalpgptlu2mxvug2jqzuvces",
      "tb1pk5q2lmkx5yg63dnnvphckhfxrms89mgq5znx4lc7dxzrym62d45sfmpyq5",
      "tb1pm89axrmkavrdrwgr3dec0q02wsfjdw49envd54j6xh96nylde2vs2hjuan",
      "tb1pfzxjjry8ew2e9pq75tawfp8ge8kdrucnzng97d5whcrlah7p5qdsp0y9r0",
      "tb1prfmk8d8s80l638jsnyz6fv086yhm47mrape0tdxcepafjke2un8qe5zzgt",
      "tb1p96s969w6va6tyacdkn7c8smcyt7kknhe766dkapvwndgv46m0ryqcqhwlt",
      "tb1p26svm5hxxlgk70262m7wesp25fhxlayxsczf2xlmk62zvnh07l9q40cjf2",
      "tb1p74qt90u94gh4qrtc8akhwa39wm3puavez7plpa83ydes0nw3cfcqqvv0zy",
      "tb1pcsmgradg83ycfhtaw8ytu5j42ugxwkqu7te70m2mf5nmkzuxzkgqmkk4n8",
      "tb1pzm29st5rptvca0j29zv8wxjxpy3md07lwl4zkx34v2fjxx82garq8sm93u",
      "tb1p3yt8kq90562hgw0lyu79w9npvmuzayclzkeekkttdy8xhxwlputqww5m6t",
      "tb1pu7u7lp5563a3uw9pzk0q6gxuc89rq5xplvk852g0alngxjqqk9us4q8mr9",
      "tb1p0regqzle3wje3jmnwv97xu0mppvylmvdgjjqen99lsz7pdzjkzjqeytsuj",
      "tb1pag2ff7v4y3tsu0dppvgsh64ygsz9mfnrn9k28a4e3xpsg2h92r4s53uahr",
      "tb1p3l9xyxhzwaluq6kazykdvyu5dewchn5uhvm94ld4g63u8k8v6jnstreefe",
      "tb1pc0cm88syurcetq9a03x444jluvqt3p04k63a9dg5x8qr7zt67n5su7r69e",
      "tb1p670tr422dlqrzd95l5g7snluqcz7yhcj5eexsu5ytj9p0dsm2zusw9walg",
      "tb1pg3w982r5dxk3z9j3fd74ghan0fe3l3pmhrfz04cplgeqjsmusqssy0t8pg",
      "tb1pk579d9sju7t3lzmeeacmd2y0h6dyfnzx8yzjcgz02z2ug79g8rtspzp6lu",
      "tb1pdx7tlgw3xezre2wya9hdkdwg34asnpx7l8q6axgrkepec3xqangqfafpu6",
      "tb1p6kw4kvv4y4ewmlv7rcecjf3t7vaajfwyvt0mjnxc9k0wrm4hak7svdazyn",
      "tb1pfrf7hc5090lxs5wftvlqwnh2n3dptht496s9nf5lxyzfm9jh4rxq7zuq6s",
      "tb1pvntx8aqka0wsj03th4v7mfkukr97hrwv2vm5whewrzdl85p76dgq5urgxd",
      "tb1p9rlpyvp7jr6fu2m30749p9zfmatcs3prcce98ze0xj8nge2y273qs28taq",
      "tb1ph7wwpv4cenjcm5v0d4qfwm5tustt98cs65yktn6mt656zuzkg99q0alw60",
      "tb1p8xqu9kwv70cx483tjz4prkmt2f2ttrrske0f5eh846zjtgdvgv9q4awkpe",
      "tb1pmaw63647yxcr6as6yy7e8xe0srqulp9zsfxavhc56rnjqt3pfsqqr3snjy",
      "tb1pxyrgvxqywvl6w4qywzw0ztrjhs70ayclxtsnvfc0jn34dfml2tlq5jpz6s",
      "tb1p9tpxms5wrwu2lhenl0kyw3nrnx908rdk8fzfy706kgc3ut45ljpqmpy4er",
      "tb1pmx2x2mrty20yf8vwzldt0ce5xwlqddvxqhct6dlqwuhlxjrjcfrs7y3wat",
      "tb1pkp0tkca5xyw5093junxh9dcd0gaphuu8f0h05nfuhravgx632n5s52z2l6",
      "tb1p52533vctsuzj3zunmkgf8ndwu4gszzyyryd2e4j3w4nt57z0sw4q353j9e",
      "tb1pw8r4gd5lxuq3gyv9ny6m3j9qud7wjpa2n6796mhuth2repze89wstnu6d8",
      "tb1p002vjzaa5w7yu4lw723krvzpjlpppukz8c4tckhwuks294rd6xcqt4f6su",
      "tb1pgs368krt66atx3mf43xt34d60gqng8hatlpjvps322synq0cx4aqtvp6a6",
      "tb1pqqu8w9fmnwjln2r6pe7ymfrdam80esgrtek0fj6lecefhs8ec4xqwv7g6n",
      "tb1pchkagrq5pxvyu80z0dgvcjjxjdlguaacazlkt94prrwnarkwxp8sn77mwd",
      "tb1pjmh6tz84gtzcla45mmyhjpxxx2n06saqdqtglcn8qwutrn27gcqsnk7j4c",
      "tb1ptv5748jm7c8as97fz92sh70zrtvkm23jymju6876lw59q96eug4sdlje9c",
      "tb1p0z5cq3hruv5czy6f4975l23sfgq89cg6naqfm47ampx22qf2lfgst6vwuw",
      "tb1pycfr2vrh6v9mv8zg9jju54gvwgyxlj3ugkmtla6e6gx7enx76q2su333az",
      "tb1pmezqm95ptnrc8w2mptfn3ewwy20wepy46qkdgp4eyu96yq8f9xpsztqd43",
      "tb1p8mcetejfhvzdtvqlqyra6sgtt7v7t2syuv4us5f43f3nc6fjcq2qkplaan",
      "tb1p2ppj5qeu6g2tc6xznqfdy6k08pcys939c2me3hdvslvq3uzd73fsdwlk90",
      "tb1ptc6tgwjz6pek32ss4rs5mwmzjvxtr4qwfztdesgft9t05xt6awpqz9qlj6",
      "tb1pxjzgazrfj937rzx8w8us9zv2yzy4azd6lva35ee935nezmm0jlfqh9xp9h",
      "tb1plpm32hltxv72v770dk90az3z5nh0z83n9rcq3z2zxx6ugl2l5r0stke74q",
      "tb1pk3mx0xvgelhxee9zqe0xgc3y088djq44stn0ff7nvsd3fs47unnsn9evl0",
      "tb1pqvukz0uealeex6yptwrhjd05eh25wnpesatzm0uh0v0dk72p6dsq0j2taf",
      "tb1ph6ld9zw5qm5jd0j2mq98ye4kmehtppxt699dcdwf8d7m56jr6x3sy87swd",
      "tb1p9dpq4tq7et38p2phx8sx9yq6ph5wvpa820ux7nz4pnsmh8s3q6jq75nxj8",
      "tb1pcr3kvvgttqefja9s3nmz08kt5yestemklxq5gcx3pcjdg52ag9js7weeat",
      "tb1pntlx8xaute386qj29335g3ejk7us0wps6hwm9q4llglf30r3xr8sjcgk0r",
      "tb1pvx09nw9c3wgc43358ywf9snlyagq2gs9jdtl4rdtpdsjfeunkjjsx6p5q7",
      "tb1pfg56c8sklqsa47n7jz5ax0n7yag6hswez4feu0e6p9fwxhm4rars3zkggu",
      "tb1ppuzvyccqc7g0hwss4ysy2s32ghf08rsmmv53e0zlnhqnt0a274vqlplsec",
      "tb1phaj79k3d6n7nn2xdp9mzmepmvzdau5g80yae2k6r5ennt8lvjmesf9jg25",
      "tb1ppv02nvaxsfx2xezjetvun0d4ln5gzjp9jqn9y3ra36xckpmagucqdmy7dd",
      "tb1p5y0jpagzlpk8dws8r6fr3g30vw29yfsjvf3d0ekramary86mcncqcjvtgl",
      "tb1p729ddk75k7un569syuk7h5yc0duwu5qam8x0hry0dp8ex4j6lkpqcr6vy3",
      "tb1puugaqfwfqkht9xtf65dknr9fngr4txcwmzf2fc9qu3efm4y6704sunqw7a",
      "tb1pl02asw8ty29lr3c3qspndveel67lfrcuvjmhhs99u0w9hmpx47fqgevt4c",
      "tb1pdkngmxw7nj0scm9xjc4zlrgs49wnksxcp5436749r03ytaywf6nqzy2dqf",
      "tb1p637rjuhm6wm68ntkjqstc272qr54w8j4frd68nafsmqa82jyyn0qxd49ec",
      "tb1p2sy9rd6hjapxnjhxf308mc9qxhd30d57ed86urwy9tl07tq6pg4qdrqqcj",
      "tb1ptp9t0yvq0n92d4rrzspad8xgmlthvwmwtdde93hhsdk30852rzhq35hu5m",
      "tb1p7khtjvv20tuuqgcfwfy8g54mzua0x3y226ffckrnzd8fw2wast0qp2q929",
      "tb1pgmtspr3e35kmjpg0q6xlvq62z2kw4r3uk9q6hnrwcrh5d5jrr2asg2nun3",
      "tb1p457gkz0ydrjhxhu6cggdzxvus5zsk34j45h2kmuckzuk34ym76ysx494w2",
      "tb1pwrke7rqpjjudngkzg3m2ftye30dcutag3004c20q7v9ec9wc6pmq90hq2a",
      "tb1pkpcmehtanm3ca9tvgwfvvs84h3nl5tl06qlmstdpydlv9z8h2fus6ndhn6",
      "tb1p83q042va5elkgq5t7hlnpqrqxppn85c84qlaktddnmpw2vdchhls9urajy",
      "tb1pazqrunrd5nks3mxn4ag8wzlzup9kc6rnqf3jm4x33khe9hmqlh6qgvyt8f",
      "tb1p3l2hgvv3dv2h2g9g5ujha7xx7f69nswkq84d8cvjuphwefl453gqmx0n2e",
      "tb1pqn4naaat0a8qzdlz5qcf2t676kmm2cnxrua80rw6gt98zz6n32wsf8dvnu",
      "tb1pjakfp9gwawgk6ruelrmm7vf54e03e85na2d7667ysd8x7scsuwgqgmhpns",
      "tb1ph7hy40mccrgc7l2kxk0mjq8zxsrlyhzxyxjly4e6xnm0jyhlkj8sxttv2l",
      "tb1ppx3hfa0pwtvjcsrn8huflrdaygza4dk9tp34wjcdlvx0rk3lup0qtp7lra",
      "tb1pxhlh25u7xjs64n605qka7y7scfduy0mlmq23mghl2uggmknmg0tsmjteup",
      "tb1p6k25sjnpy45hz28z2r83e4s7wltvrwzs2pvzmkjkmnve07es344s5xkw6j",
      "tb1pv59ynddpeapvkaehf5mgj5vdduwk0y00xgg9wwjj2dpz56sedzjqyryarz",
      "tb1pmhgk6pkng5hmmlug9xvmh4yahrha8ghqn99m2ghzy73s7ar9h56shl0zxm",
      "tb1pk9xj7e3ywvjfpdgr6xdx0ek5tacn3a0eeqdtctx4j83zcfhe5ndqy4fgjt",
    ];

    const changeAddrs = [
      "tb1pmr60r5vfjmdkrwcu4a2z8h39mzs7a6wf2rfhuml6qgcp940x9cxs7t9pdy",
      "tb1p4xh0qhs7zmgv03krhwcfq53f3973sz07qv8a57taplz4zxxgf26qs82js6",
      "tb1ppw88fp4uxp4q4mah5lqq4uzq24pdkxkdw0hve2p8w8x0tlj7kc8sx2ph6j",
      "tb1p3xgy5c6g6lle53x5nkutd2q8cc3ws6pkf328mfpx7v945csnrp4qqmlew6",
      "tb1pu53aqtejgsygsw83eljjj5mhs3hzta76enh7ud77f4gjx9hr9a4q4uxxx5",
      "tb1plv44m53el0ay6y08jl8uapjp39ax8tf3jdwudwqqm5fujxx4v50qt9k9ps",
      "tb1ppejgx4ufc03fgxhc0ltecmqx447xa26cmj587llek839mecqm53q7wxqm9",
      "tb1pd7zeel5cy67mrfd6npy20updsj5uchdpqy7qrl5nrhmendra3w6qe68wzj",
      "tb1pjdjhwrf2tknem5t35rt87p5sxdqgd30mjqr3k9dqna035u8m3y6q0r4dn6",
      "tb1p98d6s9jkf0la8ras4nnm72zme5r03fexn29e3pgz4qksdy84ndpqgjak72",
      "tb1ppwmjmny8wnffcdpa5q7lh4e75vn02v5qjt46z2x8mgll9kl40t4qpw9ppx",
      "tb1pyvdzg5vvhmwxyx4uljg3jf6ex8a7ls58cceljlss3ggtwjd6jvms433ad3",
      "tb1p8z8umjkzwjt2njsggzlwkcdlhuajfzj7tzvt3rcxy9w2dmpn9lhszf9ygd",
      "tb1p0rmsxcdhte6l8k3fc72f5uw60lv4cda8sl9p89rsp9nqkdzjwetsc3a6vx",
      "tb1pu65ggxqxcm9y3m2d6zqrasdeuwwn8j7gqkptph89eeqduzym9jyqdp3vg8",
      "tb1pm794ga36m2av3fd77ql20qu6k057ks0rqwazns3qns26adt73yjq9247zh",
      "tb1przxjjv7ewazmjcpfyedsmhgwr5dq3f07f300tlg538npqvqqvwssx9ev2s",
      "tb1p0scchg00pl7yvvx23n2zc7l2l8d5l5jls4rzvj38gcfyqp4q6j7sm9hv39",
      "tb1pu2mz7yvrpwuvvpxhdxet2lld3d9khcujh6hlz8cg9gmaymdmc0uskq5rmc",
      "tb1p78nltexn2ypg7y722eqlazwlkydfjucszsnpld03feaz9mwe90jst650nm",
      "tb1pw5yqrd4gffn6flfnl38yg3n5n72lql9ntmmz70znhj7guh4ycydqxnfc2q",
      "tb1pq7svumge0ue6urxw5rfw4thpaxjxzt673wj988e2u5lmf5wjn2gscpay4j",
      "tb1p5w5gznxq6592fkmg2chjx5a2y83t8gc7dh0xv2udlg9550dk9rvspy92hx",
      "tb1pe9l9kfknjmxn6mru85w7ucvm9zx2v5gujmfqx9jdjtx60hdvru8qfhqesd",
      "tb1pdxvjkynm7g9zvvcc56rqsuqxlmz7f8zh3eczz3n9x5l70e0qhdfstzr3wx",
      "tb1p92zmv6y2enjfg66dkym4zl7t4v6sd42r89jhrf2wk4acu6rm7fhs593urh",
      "tb1p7u5qu04pppv5lcdave9arcuuq24tazuth6gack85rf984w8d5atqcwwtva",
      "tb1pz9qky6lwzsfkpru3sjkauj2hz04hrv0um0s5ff70v7zz6epp3whq00fhxw",
      "tb1pe25mj599lzq4jtpf4jkrtuxwt6j50jx0ta0yftye5e5ykjuldctq75sxew",
      "tb1pjvjmkpw6207stqsffaj2fws246a37lnq5f5a8p2rxqtx7uewygaqkckzpd",
      "tb1p6qkvgsy6675fn6hksv4mfjna2dzwv0vkfvx50qx2y2f5kuvdv9xsjsc3a8",
      "tb1paqu88uskqz54rqcq5c27e3hfjxe78htqxhep8ja8wqem5fq5zaqs92m52t",
      "tb1p4w7556c7x0ufssctzuwqdkzta7u4dm6ep3mtf36gn32yh9k6zdaqrxg7jc",
      "tb1pwadsxxxfanl0kp2uul54kqc4trdvxukqdmam6pg924aczuv9ru0srqrdku",
      "tb1ptpgdss5t8k2crev7m9jtk7cjykfg4kg8qqavq825cql5dn4ytvjs9rrfst",
      "tb1p70wtc04xmwlyfkauave3wwuzudnt4r5gjad8lacdw88skamnwq7s576lxw",
      "tb1pjsfs0lcn8zfg95f7qky4p2ata42txulmjd3sqajr3g5z2z2gvncqwzxt5g",
      "tb1pkz3uql3z2m9n407hnh6neh9cnwa02l4hrc4gvt7nj0tcw3yupr7s4l9655",
      "tb1pvq895aatatmw37m947h2p5j9wrsu8h8ec5u34shyzf872gnv93rszp52hp",
      "tb1ph266tv2hq94lucaghrxcx6dgjsxvxlmqysv6av45txldsgj5ec8q4vyy9h",
      "tb1pds0c2n9mpkggrgkww73pu2w5zwuwrgec9s934k4j8dzfqva98qrqu33vdc",
      "tb1pwlsrcadnxkqfxtgfhn2yz26aelmkl008404qvn6xekcfyplx4alq27gsly",
      "tb1pvvrak3lmnhpcxx3j6r3tx5m83mfheyvvactj2xcqfpj5dqr86trs0s4zh4",
      "tb1p385h32q7fs9tvh35cstapywxhnh7vtt8pfyx8dafwtscv3hyl6uqkvr355",
      "tb1pk2k0tmsx66xe2acnaqnpk8y6ghe9ay4ac72k3rc2m27yr3cnl8hq955frr",
      "tb1p87wmvhe8uz4uajtus5wdaaqlxzhdglf0npjkvc2dyuvrny93mnnq6538rn",
      "tb1p60mdmqzjw8uv9gtzvc2qghgmpqu3uwrfhg4efzck0fea7fevvgqqfsflld",
      "tb1pnz80qj62lx2jfg7npw58n6ajdn8w9yj3egw0yqmln44aspfkrktswf5487",
      "tb1pvjjq4gfy5fhp4x4y29sv35mdp4z76l8qeheda39jw7kk7fgpze5svvvqvw",
      "tb1p0dr02a5d7glfeca5cxpkya5xvzdjpp29sm9v4q3xed8z2vlkx98s806sxk",
      "tb1p70hv7d2xrsa6mnt5emw7eh4k9c26vnnltff53uwyyz2h4fgwqsmqeyggvx",
      "tb1px3r0c7adqw932x474exy5p3xcqt9xlxk6f4507sf9v3l7lgkk0kq4h2ht9",
      "tb1px43lfqm3m2u5g3fsyklazmvu93ur23phmxm0zsdtyxgenequ7c5qxzpxpq",
      "tb1pf8casgy4kky856eldyy36lhrj6jgjw5zxv86mpuvxfrmtgd408ns6fs4wl",
      "tb1p8v3j9cjfehxu7p2498cs02dwkqlg34nk4fnht2m28v9d93dfq8gq9x27lp",
      "tb1p96rcqur42r2m5y826qq0p0l4knw3sgf0mvwqkss6cdpxgm8vq2zqpzchyz",
      "tb1pk3qxzxv07q9acyg7y5j5lqqmy4rv27lw8mfgwaccf5hr3dkk7u8qjdah8z",
      "tb1pqrnrlaaapdyn0k3vg0xcry85wt3fuempnpw3fd56yapsjaf3pn3stmjwds",
      "tb1pjfaamay3f7j8lzyg4px65nhn9pv98f2nml5rsvrarzcp7aaxq0hq38yqhk",
      "tb1pz57yt30a9373myrpnvgaxp5uatswr6smc974zyc8r7p44pf7jdcsnl86kd",
      "tb1p3u0z5wndq8fhfr45x9etqkyrp4xj5cyuhlv9uthmy4v8cvhqqadqvfrncy",
      "tb1pu5m7ylzz6ujr7datcst0j87hzthaetf3ppkcha5xfrf8zvty762q8aqqp6",
      "tb1pheged3wv20h7zndpryuh2kc8urzpsrnl7p7c5u9fl0smpy528p3sp9eynr",
      "tb1p7drkww9wlslynwrtfw3gdanrs26cww2mjfyxu8dv7mw0d8n4uj3svlr8xu",
      "tb1p4sflk8wpgj0v6vf6wnu89g22zl9xjhv0u6pd5rt7m64jza789jqser4p9z",
      "tb1pggvctzs2qhlqg6j5gl4jjrca7cr4jxldzwnpj62ptftx2c7yjymqedya29",
      "tb1phx5znmhjn3z46g0n800mksw5s2kx6leups8uguwcqcqudyfy7d9qq37m7r",
      "tb1pln84us5u4xe2670xwc3l4l4mpejfydl6arwjyqechl0e6v3jjsrsm8cfdl",
      "tb1p8055dcyg5e6ql3j360nk33ehzgh58hl34r0nnyku5a6wqu28nkgqfegezt",
      "tb1p7e52eaqz4h9v7999dea4st0wk3v0thlensrnj9hynh8ppe7yt95sqy3d5a",
      "tb1pujn5wdctq80gdp28atnxneqfqj2p7a6pk040tt3vg8j69dszfk3qkp4ny7",
      "tb1pjfgu8cw3y537lykfdtn4pdmd90xdx4lmh90wq78z4247adtc9j7s372fn7",
      "tb1p387s9klhs9vees0246l88ktmxn5kunf8nccwzx74qqshnjsfd02qu2j32g",
      "tb1pw6msjszjhckluqk2ypw7fy4vprjmpkhw05elgytqda7yhfuut26q62ywhd",
      "tb1pwgpslxynjhxwgazqs298prphsfgpdslsgw2nggtl60s55n2m0mpqlnnssn",
      "tb1p0lktg8gfdn4n2lhsgq7cmpg8d7w7y7nh037pg34ga0pv46y6fffshgr287",
      "tb1pchdtlya5y4868fxx3tv7yzq6kewftyvytw6n3f6fdvz8z6nexjvqeqkz36",
      "tb1p2cha976qdwvmq07kchqyswhj6pvt7qjwjc6jrvjtqlsmvm8xq07q6a2jwt",
      "tb1p8qyezr8fntwxzn67c5u5tgwsn035sp6dtsrt9juxs0x6us4avseqdnzn5x",
      "tb1p2d4nqw8nf6vzs47hxpxx7nacadsa6py9gapekpmfn3uk8mndczks8y6747",
      "tb1pnyvnujkkkc9fnf30d7mt08wc498699pcm25jnwykuzsmnkhkgszssk5hye",
      "tb1pewnt3lu3txe7p39fatdajlzpzqw877y6xyp6fx8fn2k8x72cj83s5hgted",
      "tb1pqkmzxurj2n0xl2zfj95grdvgwzgkmfdf97m4pdr9cqqkx9fx8rhs4vqd72",
      "tb1psu7u3hkyrtgzz4qs334602zdd4zz4u0r6zajq32scx0vshffdugqp6c7m6",
      "tb1p6uppu0876xmukkjgza3nfgrs66m9ulvx9vs5n538shq6gdqkcdkqxhg7jt",
      "tb1pynzqddzwzgx3059c273aw49r58k4h6nky5nz5f55h4acqp9alnaqkyd45r",
      "tb1phgcrtu54j0jwpfvrmfzxld86jraydtgppm57atn3gflyjlqw4uwqspuuuu",
      "tb1p59srx4xqvg5n5pf7mjt9wmuv3s8flh0k0a889j86khrjm4mvmqhqltk7e7",
      "tb1pty3t7eajk8ekw8fkv83flh5jhz00mxua25cqa3ynxwp2nz0hjtgq26em7r",
      "tb1psm2hknqsxupjulanrcstnr0sddt037czkg0qenkpnelrjkj2yhuq9ww54h",
      "tb1ppc6vncx3ug2u6ua79svvqtn0klxv2lt2aeg3jslr092mrhmgaykspq2dxg",
      "tb1ptkdaxzj2ezgqc2n4lg7j77re8u090fgf6fpkkphy0j754cnuy7zqagvmnu",
      "tb1pexy6juy5d0gevf0gnf2dtuzl62fnw7fpktce8n6ds3kc6g95mgfsg2hkf5",
      "tb1pul2cjczswdpez866k9uddkc6p2u4g6qzfgj248a2nuhzuh3dctms9r0x3m",
      "tb1p46xhkqlrh9dh3f09yckjfp3y4wflvf0smm832jnfe3w33rezvraq7xu6ew",
      "tb1pd7969v7vcwpa97s86cfgs5eqwhqn0m8s8qt2r32g7hnktsxcmdwsqkd7vs",
      "tb1pedur2zp3xhllcpsx8kavrxdg4emwayvngqeg8ffq3w3ec73tqrcqt8pj2k",
      "tb1p3272tayue3s46qt2fpl7972wlvlaussesj0gmn4q863u2fadkgzsphclqa",
      "tb1p4zypzsqgdq4hj3029aqhqu95gz9mrrw7l3t7udp9fappqtfwjgfq3km29m",
      "tb1pkhlmr4xz5w8x8py8x7670zp9lzykhepw74jltvpleff3qpxc3m2sgsmgnu",
      "tb1ptp5mua0w462ahk56y8uvqgkv3pxk44dz67vjtax4jnu4ajm8ykgqd80ndj",
    ];
    const xpub =
      "tpubDDKYE6BREvDsSWMazgHoyQWiJwYaDDYPbCFjYxN3HFXJP5fokeiK4hwK5tTLBNEDBwrDXn8cQ4v9b2xdW62Xr5yxoQdMu1v6c7UDXYVH27U";
    extAddrs.forEach(async (expected, index) => {
      expect(await bitcoin.getAddress(DerivationModes.TAPROOT, xpub, 0, index)).toEqual(expected);
    });
    changeAddrs.forEach(async (expected, index) => {
      expect(await bitcoin.getAddress(DerivationModes.TAPROOT, xpub, 1, index)).toEqual(expected);
    });
    let prefix = (await bitcoin.getAddress(DerivationModes.NATIVE_SEGWIT, xpub, 0, 0)).slice(0, 4);
    expect(prefix).toEqual("tb1q");
    prefix = (await bitcoin.getAddress(DerivationModes.LEGACY, xpub, 0, 0)).slice(0, 1);
    expect(prefix).toMatch(new RegExp("[mn]"));
    prefix = (await bitcoin.getAddress(DerivationModes.SEGWIT, xpub, 0, 0)).slice(0, 1);
    expect(prefix).toEqual("2");
  });
});
