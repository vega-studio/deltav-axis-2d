import { EdgeInstance, LabelInstance, Vec2, Vec4, AnchorType } from "deltav";

export interface IBucketOptions {
  labelColor?: Vec4;
  labelFontSize?: number;
  tickLength?: number;
  tickWidth?: number;
}


export class Bucket {
  showLabels: boolean = true;
  showTick: boolean = true;
  tick: EdgeInstance;
  mainLabel: LabelInstance;
  subLabel: LabelInstance;

  labelColor: Vec4 = [1, 1, 1, 1];
  labelFontSize: number = 12;
  tickLength: number = 10;
  tickWidth: number = 1;

  constructor(options: IBucketOptions) {
    this.labelColor = options.labelColor || this.labelColor;
    this.labelFontSize = options.labelFontSize || this.labelFontSize;
    this.tickLength = options.tickLength || this.tickLength;
    this.tickWidth = options.tickWidth || this.tickWidth;
  }

  createMainLabel(
    text: string,
    position: Vec2,
    alpha: number,
    padding: number,
    verticalLayout: boolean,
    onLabelReady?: (instance: LabelInstance) => void
  ) {
    this.mainLabel = new LabelInstance({
      anchor: {
        padding,
        type: verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
      },
      color: [this.labelColor[0], this.labelColor[1], this.labelColor[2], alpha],
      fontSize: this.labelFontSize,
      origin: position,
      text,
      onReady: onLabelReady
    })
  }

  createSubLabel(
    text: string,
    position: Vec2,
    alpha: number,
    padding: number,
    verticalLayout: boolean,
  ) {
    this.subLabel = new LabelInstance({
      anchor: {
        padding,
        type: verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
      },
      color: [this.labelColor[0], this.labelColor[1], this.labelColor[2], alpha],
      fontSize: this.labelFontSize,
      origin: position,
      text
    })
  }

  createTick(
    position: Vec2,
    alpha: number,
    verticalLayout: boolean,
  ) {
    const {
      tickLength,
      tickWidth
    } = this;

    this.tick = new EdgeInstance({
      start: position,
      end: verticalLayout ?
        [position[0] - tickLength, position[1]] :
        [position[0], position[1] + tickLength],
      thickness: [tickWidth, tickWidth],
      startColor: [1, 1, 1, alpha],
      endColor: [1, 1, 1, alpha]
    });
  }

  updateMainLabel(
    position: Vec2,
    alpha: number,
    padding: number,
    verticalLayout: boolean
  ) {
    if (this.mainLabel) {
      this.mainLabel.origin = position;
      this.mainLabel.color = [
        this.labelColor[0],
        this.labelColor[1],
        this.labelColor[2],
        alpha
      ];
      this.mainLabel.anchor = {
        padding,
        type: verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
      }
    }
  }

  updateSubLabel(
    position: Vec2,
    alpha: number,
    padding: number,
    verticalLayout: boolean
  ) {
    if (this.subLabel) {
      this.subLabel.origin = position;
      this.subLabel.color = [
        this.labelColor[0],
        this.labelColor[1],
        this.labelColor[2],
        alpha
      ];
      this.subLabel.anchor = {
        padding,
        type: verticalLayout ? AnchorType.MiddleRight : AnchorType.TopMiddle
      }
    }
  }

  updateTick(
    position: Vec2,
    alpha: number,
    verticalLayout: boolean
  ) {
    if (this.tick) {
      this.tick.start = position;
      this.tick.end = verticalLayout ?
        [position[0] - this.tickLength, position[1]] :
        [position[0], position[1] + this.tickLength];
      this.tick.startColor = [
        this.tick.startColor[0],
        this.tick.startColor[1],
        this.tick.startColor[2],
        alpha
      ];
      this.tick.endColor = [
        this.tick.endColor[0],
        this.tick.endColor[1],
        this.tick.endColor[2],
        alpha
      ];
    }
  }
}