import { APIRequestContext } from "@playwright/test";

export class SpeculosDriver {
  readonly request: APIRequestContext;

  constructor(speculosApiContext: APIRequestContext) {
    this.request = speculosApiContext;
  }

  /**
   * Press left button and release it "x" times.
   */
  async pressLeftButton(repeat = 1) {
    for (let i = 0; i < repeat; i++) {
      await this.request.post(`/button/left`, { data: { action: "press-and-release" } });
    }
  }

  /**
   * Press right button and release it "x" times.
   */
  async pressRightButton(repeat = 1) {
    for (let i = 0; i < repeat; i++) {
      await this.request.post(`/button/right`, { data: { action: "press-and-release" } });
    }
  }

  /**
   * Press both buttons and release them.
   * Reset logged device events, please assert screens before performing this action.
   */
  async pressBothButtons(resetEvents = true) {
    await this.request.post(`/button/both`, { data: { action: "press-and-release" } });

    // Automatically reset events for next use
    if (resetEvents) {
      await this.resetEvents();
    }
  }

  /**
   * Retrieve and process device screens to return relevant informations
   * @returns { recipientAddress }
   */
  async getLastEvents() {
    const screen = await (await this.request.get(`/events`)).json();

    const lastEvent = screen.events[screen.events.length - 1];
    let recipientAddress = "";

    if (lastEvent.text === "Approve" || lastEvent.text === "Reject") {
      for (let i = 0; i < screen.events.length; i++) {
        if (screen.events[i].text.startsWith("Address")) {
          recipientAddress += screen.events[i + 1].text;
        }
      }
    }

    return { recipientAddress };
  }

  async resetEvents() {
    await this.request.delete(`/events`);
  }
}
