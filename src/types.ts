export type Monitor = {
  width: number;
  height: number;
  defaultZoomLevel: number;
};

export type MonitorKey = {
  width: number;
  height: number;
};

type BaseMessage<
  TType extends string,
  TContent extends Record<string, unknown>,
> = {
  type: TType;
} & TContent;

export type MonitorChangeMessage = BaseMessage<
  "monitor-change",
  {
    width: number;
    height: number;
  }
>;

export type Message = MonitorChangeMessage;
