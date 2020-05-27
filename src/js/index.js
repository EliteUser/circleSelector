import {renderHTML, getRect, getRectCenter} from './utils';
import settings from './settings';
import throttle from './throttle';


class CircleSelector {
  constructor(settings) {
    this.settings = settings;

    this.inputContainer = document.querySelector('.circle-selector');
    this.circle = this._createCircle(this.settings);
    this.circleElements = this.circle.querySelectorAll('.circle-selector__wrapper');

    this._clickHandler = this._clickHandler.bind(this);
  }

  render() {
    this.inputContainer.appendChild(this.circle);

    const circleBounds = getRect(this.circle);

    this.circleElements.forEach((element) => {
      const wrapperWidth = this.settings.halfCircle ?
        circleBounds.width + this.settings.elementWidth + this.settings.elementGap :
        circleBounds.width / 2 + this.settings.elementWidth + this.settings.elementGap;
      const wrapperLeft = this.settings.halfCircle ? '0' : '50%';

      const valueNode = element.querySelector('.circle-selector__element');
      valueNode.style.width = `${this.settings.elementWidth}px`;

      element.style.width = `${wrapperWidth}px`;
      element.style.height = `${this.settings.elementHeight}px`;
      element.style.top = `${circleBounds.height / 2 - this.settings.elementHeight / 2}px`;
      element.style.left = wrapperLeft;
    });

    this._rotateElementsTo(this.circleElements[0], 0);
    for (const circleElement of this.circleElements) {
      this._attachMouseHandlers(circleElement);
      this._attachTouchHandlers(circleElement);
    }
  }

  _createCircle() {
    const circleStyle = this.settings.halfCircle ?
      `border-bottom-right-radius: ${this.settings.circleDiameter}px;
       border-top-right-radius: ${this.settings.circleDiameter}px;
       width: ${this.settings.circleDiameter / 2}px;
       height: ${this.settings.circleDiameter}px;` :
      `border-radius: 50%;
       width: ${this.settings.circleDiameter}px;
       height: ${this.settings.circleDiameter}px;`;

    let values = [];


    if (this.settings.counterValues.length) {
      values = [...this.settings.counterValues];
    } else {
      for (let index = this.settings.counterStart; index < this.settings.counterEnd; index += this.settings.counterStep) {
        values.push(index);
      }
    }

    const circleMarkup = `
    <div class="circle-selector__circle" style="${circleStyle}">${
      values.map((value, rotationIndex) => {
        return this._createCircleElementMarkup(value, rotationIndex);
      }).join('')
    }</div>
    `;

    return renderHTML(circleMarkup);
  };

  _createCircleElementMarkup(value, rotation) {
    const rotationStep = this.settings.rotationStep;
    return `
      <div class="circle-selector__wrapper" style="transform: rotate(${rotation * rotationStep}deg)" data-rotation="${rotation * rotationStep}" data-id="${value}">
        <div class="circle-selector__element">${value}</div>
      </div>  
    `;
  };

  _getVisibility(rotationAngle) {
    const {edgeAngle, gapAngle} = this.settings;

    if (rotationAngle > edgeAngle + gapAngle || rotationAngle < -(edgeAngle + gapAngle)) {
      return 'none';
    } else if (rotationAngle > edgeAngle) {
      return 1 - (rotationAngle - edgeAngle) / gapAngle;
    } else if (rotationAngle < -edgeAngle) {
      return 1 + (rotationAngle + edgeAngle) / gapAngle;
    } else {
      return 1;
    }
  };

  _getSize(rotationAngle) {
    const {edgeAngle, gapAngle, minElementSize, maxElementSize} = this.settings;

    if (rotationAngle > edgeAngle + gapAngle || rotationAngle < -(edgeAngle + gapAngle)) {
      return minElementSize;
    } else if (rotationAngle < edgeAngle + gapAngle && rotationAngle >= 0) {
      return -(maxElementSize - minElementSize) / (edgeAngle + gapAngle) * rotationAngle + maxElementSize;
    } else if (rotationAngle > -(edgeAngle + gapAngle) && rotationAngle < 0) {
      return (maxElementSize - minElementSize) / (edgeAngle + gapAngle) * rotationAngle + maxElementSize;
    } else {
      return 1;
    }
  };

  _getRotationAngle(coords) {
    let rotationAngle = Math.atan(coords.y / coords.x) * 180 / Math.PI;
    if (coords.x < 0 && coords.y > 0) {
      rotationAngle += 180;
    } else if (coords.x < 0 && coords.y < 0) {
      rotationAngle -= 180;
    }
    return rotationAngle;
  }

  _applyTransition(isOn) {
    this.circleElements.forEach((element) => {
      if (element.style.display !== 'none') {
        const valueNode = element.querySelector('.circle-selector__element');

        if (isOn) {
          element.style.transitionProperty = 'transform, opacity';
          element.style.transitionDuration = `${this.settings.transitionDuration}s`;
          element.style.transitionTimingFunction = 'ease-out';
          valueNode.style.transition = `transform ${this.settings.transitionDuration}s ease-out`;
        } else {
          element.style.transitionProperty = 'none';
          element.style.transitionDuration = 'none';
          element.style.transitionTimingFunction = 'none';
          valueNode.style.transition = 'none';
        }
      }
    });
  }

  _completeRotation() {
    const chosenElement = [...this.circleElements].find((element) => {
      const rotation = parseFloat(element.dataset.rotation);
      return (rotation <= this.settings.rotationStep / 2) && (rotation >= -(this.settings.rotationStep / 2));
    });

    this._rotateElementsTo(chosenElement, 0);
  }

  _rotateElementsTo(chosenElement, rotationAngle) {
    const chosenElementIndex = [...this.circleElements].findIndex(el => el === chosenElement);

    const resultAngles = [...this.circleElements].map((element, elementIndex) => {
      return rotationAngle - (chosenElementIndex - elementIndex) * settings.rotationStep;
    });

    if (resultAngles[0] > 0 || resultAngles[resultAngles.length - 1] < 0) {
      return;
    }

    this.circleElements.forEach((element, elementIndex) => {
      let resultAngle = resultAngles[elementIndex];
      const visibility = this._getVisibility(resultAngle);

      const valueSize = this.settings.sizeable ? this._getSize(resultAngle) : null;
      const valueNode = element.querySelector('.circle-selector__element');

      element.style.transform = `rotate(${resultAngle}deg)`;
      element.dataset.rotation = `${resultAngle}`;
      if (valueSize) {
        valueNode.style.transform = `scale(${valueSize})`;
      }

      if (visibility === 'none') {
        element.style.opacity = '0';
        element.style.pointerEvents = 'none';
        element.style.zIndex = '-100';
      } else {
        element.style.opacity = visibility;
        element.style.pointerEvents = 'initial';
        element.style.zIndex = '0';
      }
    });
  };

  _clickHandler(evt) {
    evt.preventDefault();

    const element = evt.target;
    if (element.classList.contains('circle-selector__element')) {
      this._rotateElementsTo(element.parentElement, 0);
    }
  };

  _attachMouseHandlers(element) {
    const elementValue = element.querySelector('.circle-selector__element');

    const mouseDownHandler = (evt) => {
      evt.preventDefault();

      this._applyTransition(false);
      const containerCenter = getRectCenter(this.circle);

      let startCoords = {
        x: evt.clientX - containerCenter.x,
        y: evt.clientY - containerCenter.y,
      };
      let startRotation = this._getRotationAngle(startCoords);

      const mouseMoveHandler = throttle((moveEvt) => {
        moveEvt.preventDefault();

        elementValue.removeEventListener('click', this._clickHandler);
        const currentRotation = parseFloat(element.dataset.rotation);

        const endCoords = {
          x: moveEvt.clientX - containerCenter.x,
          y: moveEvt.clientY - containerCenter.y,
        };
        let endRotation = currentRotation - (startRotation - this._getRotationAngle(endCoords));

        startCoords = {
          x: moveEvt.clientX - containerCenter.x,
          y: moveEvt.clientY - containerCenter.y,
        };
        startRotation = this._getRotationAngle(startCoords);

        this._rotateElementsTo(element, endRotation);
      }, 16);

      const mouseUpHandler = (upEvt) => {
        upEvt.preventDefault();

        this._applyTransition(true);
        this._completeRotation();
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };

      elementValue.addEventListener('click', this._clickHandler);
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    };

    elementValue.addEventListener('click', this._clickHandler);
    elementValue.addEventListener('mousedown', mouseDownHandler);
  }

  _attachTouchHandlers(element) {
    const elementValue = element.querySelector('.circle-selector__element');

    const touchStartHandler = (evt) => {
      this._clicked = true;

      this._applyTransition(false);
      const containerCenter = getRectCenter(this.circle);

      let startCoords = {
        x: evt.targetTouches[0].clientX - containerCenter.x,
        y: evt.targetTouches[0].clientY - containerCenter.y,
      };
      let startRotation = this._getRotationAngle(startCoords);

      const touchMoveHandler = (moveEvt) => {
        moveEvt.preventDefault();
        this._clicked = false;

        const currentRotation = parseFloat(element.dataset.rotation);

        const endCoords = {
          x: moveEvt.targetTouches[0].clientX - containerCenter.x,
          y: moveEvt.targetTouches[0].clientY - containerCenter.y,
        };
        let endRotation = currentRotation - (startRotation - this._getRotationAngle(endCoords));

        startCoords = {
          x: moveEvt.targetTouches[0].clientX - containerCenter.x,
          y: moveEvt.targetTouches[0].clientY - containerCenter.y,
        };
        startRotation = this._getRotationAngle(startCoords);

        this._rotateElementsTo(element, endRotation);
      };

      const touchEndHandler = (upEvt) => {
        if (this._clicked) {
          this._clickHandler(upEvt);
        }

        this._applyTransition(true);
        this._completeRotation();
        elementValue.removeEventListener('touchmove', touchMoveHandler);
        elementValue.removeEventListener('touchend', touchEndHandler);
      };

      elementValue.addEventListener('touchmove', touchMoveHandler);
      elementValue.addEventListener('touchend', touchEndHandler);
    };

    elementValue.addEventListener('touchstart', touchStartHandler);
  }
}

const circleInput = new CircleSelector(settings);
circleInput.render();
