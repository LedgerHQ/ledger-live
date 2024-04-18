import { Page } from "@playwright/test";
import * as http from "http";

export class SpeculosModal {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async rejectTransaction() {
    //REVIEW TRANSACTION (sur 2 ligne sur le nano)
    await this.sendRequest("button/right");
    //Amount ETH 0.0001
    await this.sendRequest("button/right");
    //Address "address"
    await this.sendRequest("button/right");
    //Network Holesky
    await this.sendRequest("button/right");
    //Max fees ETH (voir montant depuis le front puis comparer avec le device)
    await this.sendRequest("button/right");
  }
  // Verifier dans tous les cas (accept, reject)
  async acceptTransaction() {
    await this.sendRequest("button/right");
    await this.sendRequest("button/right");
    await this.sendRequest("button/right");
  }

  async pressRight() {
    await this.readScreen();
    await this.sendRequest("button/right");
  }

  async pressLeft() {
    await this.sendRequest("button/left");
  }

  async pressBoth() {
    await this.sendRequest("button/both");
  }

  private async sendRequest(endpoint: string) {
    const requestOptions: http.RequestOptions = {
      method: "POST",
      hostname: "127.0.0.1",
      port: process.env.SPECULOS_API_PORT,
      path: `/${endpoint}`,
      headers: {
        "Content-Type": "application/json",
      },
    };

    return new Promise<void>((resolve, reject) => {
      const req = http.request(requestOptions, res => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}`));
        }
      });

      req.on("error", err => {
        reject(err);
      });

      req.write('{"action":"press-and-release"}');
      req.end();
    });
  }

  private async readScreen() {
    const requestOptions: http.RequestOptions = {
      method: "GET",
      hostname: "127.0.0.1",
      port: process.env.SPECULOS_API_PORT,
      path: "/events?stream=false&currentscreenonly=true",
    };

    return new Promise<void>((resolve, reject) => {
      const req = http.request(requestOptions, res => {
        if (res.statusCode === 200) {
          let data = "";
          res.on("data", chunk => {
            data += chunk;
          });
          res.on("end", () => {
            console.log(data);
            resolve();
          });
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}`));
        }
      });

      req.on("error", err => {
        reject(err);
      });

      req.end();
    });
  }
}
