import { Dirent } from "fs";
import { URL } from "url";
import axios from "axios";
import { delay } from "rxjs";

const nock = require("nock");
const fs = require("fs");

export type StdRequest = {
  method: string;
  url: string;
  headers: any;
  fileName: string;
  body: any;
  response: any;
};

export async function initBackendMocks() {
  let dirents: Dirent[] = [];
  try {
    /*dirents = fs.readdirSync(`${__dirname}/bridgeMocks`, {
      recursive: true,
      withFileTypes: true,
    });*/

    console.log("ok");

    /*dirents = await fs.readdir(
      `${__dirname}/bridgeMocks`,
      {
        recursive: true,
        withFileTypes: true,
      },
      (err, dirents) => {
        console.log(dirents.filter(f => f.isFile()).length);
        console.log(dirents);
        const files = dirents.filter(f => f.isFile());
        for (const file of files) {
          const backendMock = fs.readFileSync(`${file.path}/${file.name}`);
          const jsonBackendMock = JSON.parse(backendMock);
          console.log("treated" + jsonBackendMock.url);
          applyBackendMock(JSON.parse(backendMock) as StdRequest);
        }
      },
    );*/

    const root = `${__dirname}/bridgeMocks`;
    await fs.readdir(root, async function (err, families) {
      for (const family of families) {
        await fs.readdir(`${root}/${family.name}`, async function (err, currencies) {
          for (const currency of currencies) {
            await fs.readdir(
              `${root}/${family.name}/${currency.name}`,
              async function (err, mocks) {
                for (const mock of mocks) {
                  const backendMock = fs.readFileSync(`${mock.path}/${mock.name}`);
                  const jsonBackendMock = JSON.parse(backendMock);
                  applyBackendMock(jsonBackendMock as StdRequest);
                }
              },
            );
          }
        });
      }
    });

    /* //passsing directoryPath and callback function
    fs.readdir(`${__dirname}/bridgeMocks/cosmos/stargaze`, function (err, files) {
      //handling error
      if (err) {
        return console.log("Unable to scan directory: " + err);
      }
      //listing all files using forEach
      console.log(files.length);
    });*/

    console.log("ok");

    /*console.log(dirents.filter(f => f.isFile()).length);
    console.log(dirents);
    for (const dirent of dirents) {
      if (dirent.isFile()) {
        const backendMock = fs.readFileSync(`${dirent.path}/${dirent.name}`);
        const jsonBackendMock = JSON.parse(backendMock);
        console.log("treated" + jsonBackendMock.url);
        applyBackendMock(JSON.parse(backendMock) as StdRequest);
      }
    }*/
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function createMock(stdRequest: StdRequest, path: string) {
  console.log("createMock");
  axios({
    method: stdRequest.method as any,
    url: stdRequest.url,
    data: stdRequest.body,
    headers: stdRequest.headers,
  }).then(response => {
    console.log(response.data);
    const content = { ...stdRequest, response: { ...stdRequest.response, body: response.data } };
    fs.writeFileSync(path, JSON.stringify(content));
  });
}

function applyBackendMock(stdRequest: StdRequest) {
  const url = new URL(stdRequest.url);
  const originWithoutPort =
    url.port && url.origin.includes(`:${url.port}`)
      ? url.origin.replace(`:${url.port}`, "")
      : url.origin;
  const endpoint = stdRequest.url.replace(url.origin, "");
  switch (stdRequest.method) {
    case "GET":
      nock(originWithoutPort)
        .persist()
        .get(endpoint)
        .reply(stdRequest.response.statusCode, stdRequest.response.body);
      console.log("adding" + stdRequest.url);
      break;
    case "POST":
      nock(originWithoutPort)
        .persist()
        .post(endpoint)
        .reply(stdRequest.response.statusCode, stdRequest.response.body);
      console.log("adding" + stdRequest.url);
      break;
    default:
      throw new Error("unknown method");
  }

  //console.log(nock.activeMocks());

  /*const scope = nock("https://api.github.com")
    .get("/repos/atom/atom/license")
    .reply(200, {
      license: {
        key: "mit",
        name: "MIT License",
        spdx_id: "MIT",
        url: "https://api.github.com/licenses/mit",
        node_id: "MDc6TGljZW5zZTEz",
      },
    });*/
}
