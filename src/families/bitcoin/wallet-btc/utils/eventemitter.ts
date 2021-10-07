import events from "events";

export default class EventEmitter extends events.EventEmitter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: string | symbol, ...data: any[]) {
    super.emit("*", { event, data });
    return super.emit(event, ...data);
  }
}
