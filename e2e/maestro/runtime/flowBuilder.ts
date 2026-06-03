import { MaestroCommand } from "./maestro";

export class FlowBuilder {
  private commands: MaestroCommand[] = [];

  add(...commands: MaestroCommand[]): void {
    this.commands.push(...commands);
  }

  addStep(label: string, commands: MaestroCommand[]): void {
    this.commands.push({ runFlow: { label, commands } });
  }

  get size(): number {
    return this.commands.length;
  }

  drain(): MaestroCommand[] {
    const drained = this.commands;
    this.commands = [];
    return drained;
  }
}
