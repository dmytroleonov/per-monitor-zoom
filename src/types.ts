type BaseMessage<
  TType extends string,
  TContent extends Record<string, unknown>,
> = {
  type: TType;
} & TContent;

export type MonitorChangeMessage = BaseMessage<
  "monitor-change",
  { width: number }
>;

export type Message = MonitorChangeMessage;
