import { URL } from "url";
import axios from "axios";

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
  try {
    const root = `${__dirname}/bridgeMocks`;
    await fs.readdir(root, async function (err, mocks) {
      for (const mock of mocks) {
        const backendMock = fs.readFileSync(`${root}/${mock}`);
        const jsonBackendMock = JSON.parse(backendMock);
        applyBackendMock(jsonBackendMock as StdRequest);
      }
    });
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function createMock(stdRequest: StdRequest, path: string) {
  axios({
    method: stdRequest.method as any,
    url: stdRequest.url,
    data: stdRequest.body,
    headers: stdRequest.headers,
  })
    .then(response => {
      const content = { ...stdRequest, response: { ...stdRequest.response, body: response.data } };
      fs.writeFileSync(path, JSON.stringify(content));
    })
    .catch(error => {
      if (error.response) {
        // happens on 404, example on cosmos account that has never been used
        const content = {
          ...stdRequest,
          response: { ...stdRequest.response, body: error.response.data },
        };
        fs.writeFileSync(path, JSON.stringify(content));
      } else {
        // internet dead ?
      }
    });
}

function applyBackendMock(stdRequest: StdRequest) {
  const url = new URL(stdRequest.url);

  const originWithoutPort =
    url.port && url.origin.includes(`:${url.port}`)
      ? url.origin.replace(`:${url.port}`, "")
      : url.origin;

  const endpoint = stdRequest.url.replace(url.origin, "");

  if (
    stdRequest.url ===
    "https://osmosis-api.polkachu.com/cosmos/auth/v1beta1/accounts/osmo19h8cennrkf09sjxqt36lmk93fzyrcwrfxw784y"
  ) {
    console.log("FOUND YOU");
  }

  switch (stdRequest.method) {
    case "GET":
      nock(originWithoutPort)
        .persist()
        .get(endpoint)
        .reply(stdRequest.response.statusCode, stdRequest.response.body);
      break;
    case "POST":
      nock(originWithoutPort)
        .persist()
        .post(endpoint)
        .reply(stdRequest.response.statusCode, stdRequest.response.body);
      break;
    default:
      throw new Error("unknown method");
  }

  //console.log(nock.activeMocks());
}
