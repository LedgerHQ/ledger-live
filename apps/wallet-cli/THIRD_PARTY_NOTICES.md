# Third-Party Notices

`@ledgerhq/wallet-cli` is compiled with bun into a single self-contained executable. This file covers the third-party software bundled into that executable, structured in three layers: (1) the **direct third-party dependencies** declared in `apps/wallet-cli/package.json`, (2) the **transitive JavaScript closure** inlined into the binary by tsdown/Bunli, and (3) the **Bun runtime components** statically linked by Bun upstream.

The wallet-cli source code itself is licensed under Apache License 2.0; see the `LICENSE` file shipped alongside this notice for the full text.

---

## 1. Direct dependencies declared in `package.json`

| Package | Version | License | Copyright |
|---|---|---|---|
| @segment/analytics-node | 3.1.0 | MIT | Copyright © 2021 Segment |
| bignumber.js | 9.1.2 | MIT | Copyright (c) 2023 Michael Mclaughlin |
| debug | 4.4.3 | MIT | Copyright (c) 2014-2017 TJ Holowaychuk; Copyright (c) 2018-2021 Josh Junon |
| purify-ts | 2.1.0 | ISC | Copyright (c) 2018, Stanislav Iliev |
| rxjs | 7.8.2 | Apache-2.0 | Copyright (c) 2015-2018 Google, Inc., Netflix, Inc., Microsoft Corp. and contributors |
| usb | 2.17.0 | MIT | Copyright (c) 2012 Nonolith Labs, LLC |
| yocto-spinner | 0.2.0 | MIT | Copyright (c) Sindre Sorhus |
| zod | 4.3.6 | MIT | Copyright (c) 2025 Colin McDonnell |

For `rxjs` (Apache-2.0), the same Apache-2.0 v2.0 text shipped in the `LICENSE` file alongside this notice applies; rxjs does not ship a separate NOTICE file.

---

## 2. Transitive JavaScript closure bundled by tsdown/Bunli

The packages below are inlined into `bin/wallet-cli` by the bundler, in addition to the direct dependencies listed above. They are grouped by license; full license texts are reproduced in section 4. Copyright information was resolved by reading the upstream `LICENSE` file when available, otherwise by reading the `author`/`contributors` field of the upstream `package.json`, otherwise (rare cases) by alignment with the package's homepage or repository.

### MIT License (189 packages)

| Package | Version | Copyright |
|---|---|---|
| @babel/code-frame | 7.29.0 | The Babel Team (https://babel.dev/team) |
| @babel/generator | 7.29.1 | The Babel Team (https://babel.dev/team) |
| @babel/helper-globals | 7.28.0 | The Babel Team (https://babel.dev/team) |
| @babel/helper-string-parser | 7.27.1 | The Babel Team (https://babel.dev/team) |
| @babel/helper-validator-identifier | 7.28.5 | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @babel/parser | 7.29.2 | The Babel Team (https://babel.dev/team) |
| @babel/template | 7.28.6 | The Babel Team (https://babel.dev/team) |
| @babel/traverse | 7.29.0 | The Babel Team (https://babel.dev/team) |
| @babel/types | 7.29.0 | Copyright (c) 2014-present Sebastian McKenzie and other contributors |
| @bunli/core | 0.9.1 | Arya Labs, Inc. |
| @bunli/generator | 0.6.5 | Copyright (c) Bunli contributors |
| @bunli/plugin-completions | 0.3.5 | Bunli Team |
| @bunli/runtime | 0.3.2 | Bunli Contributors |
| @bunli/tui | 0.6.0 | Bunli Contributors |
| @bunli/utils | 0.6.0 | Arya Labs, Inc. |
| @inversifyjs/common | 1.5.0 | Copyright (c) 2024 inversify |
| @inversifyjs/container | 1.9.1 | Copyright (c) 2024 inversify |
| @inversifyjs/core | 5.2.0 | Copyright (c) 2024 inversify |
| @inversifyjs/prototype-utils | 0.1.0 | Copyright (c) 2024 inversify |
| @inversifyjs/reflect-metadata-utils | 1.1.0 | Copyright (c) 2024 inversify |
| @jimp/core | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/diff | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/file-ops | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/js-bmp | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/js-gif | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/js-jpeg | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/js-png | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/js-tiff | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-blit | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-blur | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-circle | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-color | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-contain | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-cover | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-crop | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-displace | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-dither | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-fisheye | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-flip | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-hash | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-mask | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-print | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-quantize | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-resize | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-rotate | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/plugin-threshold | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/types | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jimp/utils | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| @jridgewell/gen-mapping | 0.3.13 | Justin Ridgewell |
| @jridgewell/resolve-uri | 3.1.2 | Justin Ridgewell |
| @jridgewell/sourcemap-codec | 1.5.5 | Justin Ridgewell |
| @jridgewell/trace-mapping | 0.3.31 | Justin Ridgewell |
| @noble/hashes | 1.8.0 | Copyright (c) 2022 Paul Miller (https://paulmillr.com) |
| @opentui/core | 0.1.97 | Copyright (c) 2025 opentui |
| @opentui/core-darwin-arm64 | 0.1.97 | Copyright (c) 2025 opentui |
| @opentui/core-darwin-x64 | 0.1.97 | Copyright (c) 2025 opentui |
| @opentui/core-linux-arm64 | 0.1.97 | Copyright (c) 2025 opentui |
| @opentui/core-linux-x64 | 0.1.97 | Copyright (c) 2025 opentui |
| @opentui/core-win32-arm64 | 0.1.97 | Copyright (c) 2025 opentui |
| @opentui/core-win32-x64 | 0.1.97 | Copyright (c) 2025 opentui |
| @opentui/react | 0.1.97 | Copyright (c) 2025 opentui |
| @oxfmt/binding-android-arm-eabi | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-android-arm64 | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-darwin-arm64 | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-darwin-x64 | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-freebsd-x64 | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-linux-arm-gnueabihf | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-linux-arm-musleabihf | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-linux-arm64-gnu | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-linux-arm64-musl | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-linux-ppc64-gnu | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-linux-riscv64-gnu | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-linux-riscv64-musl | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-linux-s390x-gnu | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-linux-x64-gnu | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-linux-x64-musl | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-openharmony-arm64 | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-win32-arm64-msvc | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-win32-ia32-msvc | 0.36.0 | Boshen and oxc contributors |
| @oxfmt/binding-win32-x64-msvc | 0.36.0 | Boshen and oxc contributors |
| @oxlint/binding-android-arm-eabi | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-android-arm64 | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-darwin-arm64 | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-darwin-x64 | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-freebsd-x64 | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-linux-arm-gnueabihf | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-linux-arm-musleabihf | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-linux-arm64-gnu | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-linux-arm64-musl | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-linux-ppc64-gnu | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-linux-riscv64-gnu | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-linux-riscv64-musl | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-linux-s390x-gnu | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-linux-x64-gnu | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-linux-x64-musl | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-openharmony-arm64 | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-win32-arm64-msvc | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-win32-ia32-msvc | 1.51.0 | Boshen and oxc contributors |
| @oxlint/binding-win32-x64-msvc | 1.51.0 | Boshen and oxc contributors |
| @standard-schema/spec | 1.1.0 | Colin McDonnell |
| @standard-schema/utils | 0.3.0 | Copyright (c) 2024 Fabian Hiller |
| @tokenizer/token | 0.3.0 | Copyright (c) Borewit |
| @toon-format/toon | 2.1.0 | Johann Schopplich |
| @types/debug | 4.1.12 | Copyright (c) Microsoft Corporation. |
| @types/json-schema | 7.0.15 | Copyright (c) Microsoft Corporation. |
| @types/ms | 0.7.34 | Copyright (c) Microsoft Corporation. |
| @types/node | 16.9.1 | Copyright (c) Microsoft Corporation. |
| @types/node | 24.12.0 | Copyright (c) Microsoft Corporation. |
| @types/w3c-web-usb | 1.0.10 | Copyright (c) Microsoft Corporation. |
| abort-controller | 3.0.0 | Copyright (c) 2017 Toru Nagashima |
| any-base | 1.1.0 | Kamil Harasimowicz |
| await-to-js | 3.0.0 | Dima Grossman |
| base64-js | 1.5.1 | Copyright (c) 2014 Jameson Little |
| better-result | 2.8.2 | Dillon Mulroy |
| bmp-ts | 1.0.9 | Andrew lisowski |
| buffer | 6.0.3 | Copyright (c) Feross Aboukhadijeh, and other contributors. |
| bun-ffi-structs | 0.1.2 | Copyright (c) Oven and contributors |
| bun-types | 1.3.12 | Copyright (c) Oven and contributors |
| bunli | 0.9.1 | Arya Labs, Inc. |
| call-bind-apply-helpers | 1.0.2 | Copyright (c) 2024 Jordan Harband |
| call-bound | 1.0.4 | Copyright (c) 2024 Jordan Harband |
| dunder-proto | 1.0.1 | Copyright (c) 2024 ECMAScript Shims |
| es-define-property | 1.0.1 | Copyright (c) 2024 Jordan Harband |
| es-errors | 1.3.0 | Copyright (c) 2024 Jordan Harband |
| es-object-atoms | 1.1.1 | Copyright (c) 2024 Jordan Harband |
| event-target-shim | 5.0.1 | Copyright (c) 2015 Toru Nagashima |
| events | 3.3.0 | Copyright (c) Irakli Gozalishvili |
| exif-parser | 0.1.12 | Copyright (c) 2010 Bruno Windels |
| file-type | 16.5.4 | Copyright (c) Sindre Sorhus |
| function-bind | 1.1.2 | Copyright (c) 2013 Raynos. |
| get-intrinsic | 1.3.0 | Copyright (c) 2020 Jordan Harband |
| get-proto | 1.0.1 | Copyright (c) 2025 Jordan Harband |
| gifwrap | 0.10.1 | Joseph T. Lapp |
| gopd | 1.2.0 | Copyright (c) 2022 Jordan Harband |
| has-symbols | 1.1.0 | Copyright (c) 2016 Jordan Harband |
| hasown | 2.0.2 | Copyright (c) Jordan Harband and contributors |
| image-q | 4.0.0 | Copyright (c) 2015 Igor Bezkrovny |
| inversify | 7.5.1 | Copyright (c) 2015-2017 Remo H. Jansen |
| isomorphic-ws | 5.0.0 | Copyright (c) 2018 Zejin Zhuang |
| jimp | 1.6.0 | Andrew Lisowski <lisowski54@gmail.com> |
| js-tokens | 4.0.0 | Simon Lydell |
| jsesc | 3.1.0 | Mathias Bynens |
| marked | 17.0.1 | Christopher Jeffrey |
| math-intrinsics | 1.1.0 | Copyright (c) 2024 ECMAScript Shims |
| mime | 3.0.0 | Copyright (c) 2010 Benjamin Thomas, Robert Kieffer |
| ms | 2.1.3 | Copyright (c) 2020 Vercel, Inc. |
| node-addon-api | 8.7.0 | Copyright (c) 2017 [Node.js API collaborators](https://github.com/nodejs/node-addon-api#collaborators) |
| node-gyp-build | 4.8.0 | Copyright (c) 2017 Mathias Buus |
| object-inspect | 1.13.4 | Copyright (c) 2013 James Halliday |
| omggif | 1.0.10 | Dean McNamee |
| oxfmt | 0.36.0 | Boshen and oxc contributors |
| oxlint | 1.51.0 | Boshen and oxc contributors |
| parse-bmfont-ascii | 1.0.6 | Matt DesLauriers |
| parse-bmfont-binary | 1.0.6 | Matt DesLauriers |
| parse-bmfont-xml | 1.1.6 | Matt DesLauriers |
| peek-readable | 4.1.0 | Copyright (c) 2010-2017 Borewit |
| planck | 1.5.0 | Ali Shakiba |
| pngjs | 6.0.0 | Copyright (c) 2015 Luke Page & Original Contributors |
| pngjs | 7.0.0 | Copyright (c) 2015 Luke Page & Original Contributors |
| process | 0.11.10 | Copyright (c) 2013 Roman Shtylman |
| punycode | 1.4.1 | Copyright (c) Mathias Bynens, Mathias Bynens, John-David Dalton |
| react | 19.0.0 | Copyright (c) Meta Platforms, Inc. and affiliates. |
| react-reconciler | 0.32.0 | Copyright (c) Meta Platforms, Inc. and affiliates. |
| readable-stream | 4.7.0 | Copyright Joyent, Inc. and other Node contributors |
| readable-web-to-node-stream | 3.0.4 | Copyright (c) Borewit |
| safe-buffer | 5.2.1 | Copyright (c) Feross Aboukhadijeh |
| scheduler | 0.26.0 | Copyright (c) Meta Platforms, Inc. and affiliates. |
| side-channel | 1.1.0 | Copyright (c) 2019 Jordan Harband |
| side-channel-list | 1.0.0 | Copyright (c) 2024 Jordan Harband |
| side-channel-map | 1.0.1 | Copyright (c) 2024 Jordan Harband |
| side-channel-weakmap | 1.0.2 | Copyright (c) 2019 Jordan Harband |
| simple-xml-to-json | 1.2.7 | Nir Moav |
| string_decoder | 1.3.0 | Copyright Joyent, Inc. and other Node contributors |
| strtok3 | 6.3.0 | Copyright (c) 2017, Borewit |
| three | 0.177.0 | mrdoob |
| tinycolor2 | 1.6.0 | Copyright (c) Brian Grinstead |
| tinypool | 2.1.0 | Copyright (c) 2020 James M Snell and the Piscina contributors |
| token-types | 4.2.1 | Copyright (c) Borewit |
| undici-types | 7.16.0 | Copyright (c) Matteo Collina and Undici contributors |
| url | 0.11.4 | Copyright (c) defunctzombie |
| utif2 | 4.1.0 | photopea |
| uuid | 11.0.3 | Copyright (c) 2010-2020 Robert Kieffer and other contributors |
| ws | 8.18.3 | Einar Otto Stangvik |
| xml-parse-from-string | 1.0.1 | Matt DesLauriers |
| xml2js | 0.5.0 | Copyright (c) Marek Kubica, maqr, Ben Weaver, Jae Kwon |
| xmlbuilder | 11.0.1 | Copyright (c) 2013 Ozgur Ozcitak |
| xstate | 5.19.2 | Copyright (c) 2015 David Khourshid |
| yoctocolors | 2.1.2 | Sindre Sorhus |
| yoga-layout | 3.2.1 | Meta Open Source |

### Apache License 2.0 (9 packages)

| Package | Version | Copyright |
|---|---|---|
| @dimforge/rapier2d-simd-compat | 0.17.3 | Copyright (c) Dimforge |
| bun-webgpu | 0.1.5 | Copyright (c) SST |
| bun-webgpu-darwin-arm64 | 0.1.6 | Copyright (c) SST |
| bun-webgpu-darwin-x64 | 0.1.6 | Copyright (c) SST |
| bun-webgpu-linux-x64 | 0.1.6 | Copyright (c) SST |
| bun-webgpu-win32-x64 | 0.1.6 | Copyright (c) SST |
| fuse.js | 7.1.0 | Copyright (c) Kiro Risk |
| reflect-metadata | 0.2.2 | Copyright (c) Ron Buckton |
| typescript | 6.0.2 | Microsoft Corp. |

### BSD 3-Clause License (9 packages)

| Package | Version | Copyright |
|---|---|---|
| @sentry/hub | 6.19.7 | Copyright (c) 2019, Sentry |
| @sentry/minimal | 6.19.7 | Copyright (c) 2019, Sentry |
| @sentry/types | 6.19.7 | Copyright (c) 2019, Sentry |
| @sentry/utils | 6.19.7 | Copyright (c) 2019, Sentry |
| @webgpu/types | 0.1.69 | Copyright (c) W3C Contributors |
| diff | 8.0.2 | Copyright (c) 2009-2015, Kevin Decker |
| ieee754 | 1.2.1 | Copyright (c) Feross Aboukhadijeh, Romain Beauxis |
| jpeg-js | 0.4.4 | Copyright (c) 2014, Eugene Ware |
| qs | 6.14.1 | Copyright (c) 2014, Nathan LaFreniere and other [contributors](https://github.com/ljharb/qs/graphs/contributors) |

### ISC License (5 packages)

| Package | Version | Copyright |
|---|---|---|
| picocolors | 1.1.1 | Alexey Raspopov |
| pixelmatch | 5.3.0 | Vladimir Agafonkin |
| sax | 1.2.4 | Copyright (c) Isaac Z. Schlueter and Contributors |
| semver | 7.7.2 | GitHub Inc. |
| yaml | 2.8.3 | Eemeli Aro |

### Dual: MIT AND Zlib (1 packages)

| Package | Version | Copyright |
|---|---|---|
| pako | 1.0.11 | Copyright (C) 2014-2017 by Vitaly Puzrin and Andrei Tuputcyn |

### BSD Zero Clause License (0BSD) (1 packages)

| Package | Version | Copyright |
|---|---|---|
| tslib | 2.6.2 | Copyright (c) Microsoft Corporation. |

The single `pako@1.0.11` package is dual-licensed `MIT AND Zlib` and must satisfy both notices — the MIT text in section 4 covers MIT, the Zlib text in section 4 covers Zlib.

---

## 3. Bun runtime components

The Bun runtime statically linked into `bin/wallet-cli` by Bun upstream — including Bun itself (MIT), as well as the vendored native libraries Zig, JavaScriptCore (BSD-2-Clause + LGPL-2.0-or-later), libuv (MIT), mimalloc (MIT), BoringSSL (mixed: OpenSSL + ISC), c-ares (MIT), picohttpparser (MIT), lol-html (BSD-3-Clause), uWebSockets (Apache-2.0), zstd (BSD), lz4 (BSD-2-Clause), zlib (zlib), and others — is documented and attributed in the canonical Bun `LICENSE` file maintained by the Bun project.

Refer to <https://github.com/oven-sh/bun/blob/main/LICENSE> for the full list and the respective notices applicable to the version of Bun used at build time. Downstream attribution for these components is satisfied by reference to this upstream manifest.

---

## 4. License texts

### MIT License

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### ISC License

```
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```

### BSD 3-Clause License

```
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### zlib License

```
This software is provided 'as-is', without any express or implied warranty.
In no event will the authors be held liable for any damages arising from the
use of this software.

Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it
freely, subject to the following restrictions:

1. The origin of this software must not be misrepresented; you must not
   claim that you wrote the original software. If you use this software
   in a product, an acknowledgment in the product documentation would be
   appreciated but is not required.
2. Altered source versions must be plainly marked as such, and must not
   be misrepresented as being the original software.
3. This notice may not be removed or altered from any source distribution.
```

### BSD Zero Clause License (0BSD)

```
Permission to use, copy, modify, and/or distribute this software for
any purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### Apache License 2.0

The full Apache-2.0 text is reproduced in the `LICENSE` file shipped alongside this notice and applies to every Apache-2.0 entry listed above. It is also available canonically at <https://www.apache.org/licenses/LICENSE-2.0.txt>.
