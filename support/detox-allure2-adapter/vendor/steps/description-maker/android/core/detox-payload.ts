export type DetoxMessage = InvocationMessage | ReactNativeReloadMessage;

export interface InvocationMessage {
  type: 'invoke';
  params?: InvocationValue;
  messageId?: number;
}

export interface ReactNativeReloadMessage {
  type: 'reactNativeReload';
  params: Record<string, any>;
  messageId?: number;
}

export interface InvocationValue {
  target: Target;
  method: string;
  args: unknown[];
}

export type Target = ClassObject | BooleanObject | DoubleObject | IntegerObject | string;

export interface BaseTarget {
  type?: string;
  value?: unknown;
}

export interface ClassObject extends BaseTarget {
  type: 'Class';
  value: string;
}

export interface BooleanObject extends BaseTarget {
  type: 'Boolean';
  value: boolean;
}

export interface DoubleObject extends BaseTarget {
  type: 'Double';
  value: number;
}

export interface IntegerObject extends BaseTarget {
  type: 'Integer';
  value: number;
}

export interface InvocationObject extends BaseTarget {
  type: 'Invocation';
  value: InvocationValue;
}
