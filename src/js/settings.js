const SETTINGS = {
  halfCircle: true,
  sizeable: false
};

const DEFAULT_SETTINGS = {
  circleDiameter: 400,
  halfCircle: true,

  counterStart: 0,
  counterEnd: 15,
  counterStep: 1,
  counterValues: [],

  elementWidth: 50,
  elementHeight: 40,
  elementGap: 20,

  rotationStep: 12,
  edgeAngle: 30,
  gapAngle: 20,

  sizeable: true,
  minElementSize: 0.8,
  maxElementSize: 1.2,
  transitionDuration: 0.3,
};

const settings = Object.assign({}, DEFAULT_SETTINGS, SETTINGS);

export default settings;
