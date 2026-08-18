export type NightlyLayerWatermark = {
  readonly top: number;
  readonly left: number;
};

export type NightlyLayerViewModelResult = {
  readonly isVisible: boolean;
  readonly appVersion: string;
  readonly watermarks: ReadonlyArray<NightlyLayerWatermark>;
};

export type NightlyLayerViewProps = Omit<NightlyLayerViewModelResult, "isVisible">;
