import {renderHTML, getRect, getRectCenter, sin, animate} from './utils';
import DEFAULT_SETTINGS from './settings';

export default class CircleSelector {
  constructor(container, settings = {}) {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, settings);

    this.container = container;
    this.containerWidth = getRect(this.container).width;
    this.circleRadius = this.containerWidth - (this.containerWidth * this.settings.sectorWidth / 100);

    container.setAttribute('tabindex', 0);

    if (this.settings.fullCircle) {
      this.circleRadius = this.containerWidth - 2 * (this.containerWidth * this.settings.sectorWidth / 100);
      this.container.style.borderRadius = '50%';
    }

    this.zeroRotation = -this.settings.rotationStep / 2;
    this.currentProgress = 0;

    this.containerElements = this._createCircle();
    this.input = this.containerElements.querySelector('.circle-selector__input');
    this.circle = this.containerElements.querySelector('.circle-selector__circle');
    this.circleElements = this.containerElements.querySelectorAll('.circle-selector__element');

    if (!this.settings.fullCircle) {
      this.circle.style.borderLeftStyle = 'none';
    }

    this._clickHandler = this._clickHandler.bind(this);
  }

  _onValueChange() {
    const selectedElement = this._getSelectedElement();
    const selectedValue = selectedElement.querySelector('.circle-selector__value').textContent;

    if (this.input.value !== selectedValue) {
      this.input.value = selectedValue;
      this.input.dispatchEvent(new Event('change'));
    }
  }

  _setProperties() {
    const root = document.documentElement.style;

    const elementLeft = this.settings.fullCircle ? '50%' : '0';
    const elementWidth = this.settings.fullCircle ? '50%' : '100%';

    root.setProperty('--sector-width', `${this.settings.sectorWidth}%`);
    root.setProperty('--element-left', elementLeft);
    root.setProperty('--element-width', elementWidth);
    root.setProperty('--circle-color', this.settings.circleColor);
    root.setProperty('--circle-border-color', this.settings.circleBorderColor);
    root.setProperty('--value-background-color', this.settings.valueBackgroundColor);
    root.setProperty('--value-color', this.settings.valueColor);
  }

  render() {
    this.container.appendChild(this.containerElements);

    this._setProperties();
    this._attachFocusHandler();
    this._rotateElementsTo(this.circleElements[0], this.zeroRotation);

    for (const circleElement of this.circleElements) {
      this._attachMouseHandlers(circleElement);
      this._attachTouchHandlers(circleElement);
    }
  }

  _createCircle() {
    const circleStyle = this.settings.fullCircle ? `border-radius: 50%; padding: 50%;` : '';
    const containerPadding = this.settings.fullCircle ? 'padding-left: var(--sector-width)' : 'padding-left: 0;';
    const inputId = this.container.dataset.id ? this.container.dataset.id : 'circle-selector';

    let values = [];

    if (this.settings.counterValues.length) {
      values = [...this.settings.counterValues];
    } else {
      for (let index = this.settings.counterStart; index <= this.settings.counterEnd; index += this.settings.counterStep) {
        values.push(index);
      }
    }

    const circleMarkup = `
      <div class="circle-selector__container" style="${containerPadding}">
        <input type="text" class="circle-selector__input visually-hidden" id="${inputId}">
        
        <div class="circle-selector__circle progress" style="${circleStyle}">
          ${this.settings.progressBar ?
      `<div class="progress__container${this.settings.fullCircle ? 'progress__container--full-circle' : ''}">
              <canvas width="1000px" height="1000px" class="progress__bar"></canvas>  
            </div>` : ''}
          </div>        
        <div class="circle-selector__elements">${
      values.map((value, rotationIndex) => {
        return this._createCircleElementMarkup(value, rotationIndex);
      }).join('')}
        </div>
      </div>`;

    return renderHTML(circleMarkup);
  };

  _createCircleElementMarkup(value, rotationIndex) {
    const rotationStep = this.settings.rotationStep;
    const rotationAngle = (rotationIndex * rotationStep) + this.zeroRotation;

    const valueLeft = this.settings.fullCircle ? `${100 - this.settings.sectorWidth}%` : `${100 - this.settings.sectorWidth / 2}%`;
    const valueBottom = `${100 * (this.containerWidth - this.circleRadius * sin(rotationStep)) / (2 * this.containerWidth)}%`;

    const valueStyle = `
      left: ${valueLeft};
      bottom: ${valueBottom};
      transform: rotate(${-this.zeroRotation}deg);
    `;

    return `
      <div class="circle-selector__element" style="transform: rotate(${rotationAngle}deg)" data-rotation="${rotationIndex * rotationStep}" data-id="${value}">
        <div class="circle-selector__wrapper">
          <div class="circle-selector__value" style="${valueStyle}">${value}</div>
        </div>
      </div>  
    `;
  };

  _updateProgressBar() {
    const startProgress = this.currentProgress;
    const fullAngle = this.settings.fullCircle ? 360 : 180;
    const rotationProgress = parseFloat(this.circleElements[0].dataset.rotation);
    this.currentProgress = fullAngle / ((this.circleElements.length - 1) * this.settings.rotationStep) * -rotationProgress;

    const drawProgress = (timeProgress) => {
      const ctx = document.querySelector('.progress__bar').getContext('2d');
      const startAngle = -90;
      const progress = startProgress + (this.currentProgress - startProgress) * timeProgress;

      ctx.lineWidth = this.settings.progressBarWidth;
      ctx.clearRect(0, 0, 1000, 1000);
      ctx.strokeStyle = this.settings.progressColor;
      ctx.beginPath();
      ctx.arc(500, 500, 500 - this.settings.progressBarWidth / 2, startAngle * Math.PI / 180, (startAngle + progress) * Math.PI / 180);
      ctx.stroke();
    };

    if (startProgress !== this.currentProgress) {
      animate(drawProgress, this.settings.transitionDuration);
    }
  }

  _getVisibility(rotationAngle) {
    const {edgeAngle, gapAngle} = this.settings;
    const currentAngle = rotationAngle - this.zeroRotation;

    if (currentAngle > edgeAngle + gapAngle || currentAngle < -(edgeAngle + gapAngle)) {
      return 'none';
    } else if (currentAngle > edgeAngle) {
      return 1 - (currentAngle - edgeAngle) / gapAngle;
    } else if (currentAngle < -edgeAngle) {
      return 1 + (currentAngle + edgeAngle) / gapAngle;
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
    this._isTransitioned = isOn;
    this.circleElements.forEach((element) => {
      if (element.style.display !== 'none') {
        const wrapper = element.querySelector('.circle-selector__wrapper');

        if (isOn) {
          element.style.transitionProperty = 'transform, opacity';
          element.style.transitionDuration = `${this.settings.transitionDuration}ms`;
          element.style.transitionTimingFunction = 'ease-out';
          wrapper.style.transition = `transform ${this.settings.transitionDuration}ms ease-out`;
        } else {
          element.style.transitionProperty = 'none';
          element.style.transitionDuration = 'none';
          element.style.transitionTimingFunction = 'none';
          wrapper.style.transition = 'none';
        }
      }
    });
  }

  _getSelectedElement() {
    return [...this.circleElements].find((element) => {
      const rotation = parseFloat(element.dataset.rotation);
      return (rotation <= this.settings.rotationStep / 2) && (rotation >= -(this.settings.rotationStep / 2));
    });
  }

  _completeRotation() {
    const selectedElement = this._getSelectedElement();
    this._rotateElementsTo(selectedElement, this.zeroRotation);
  }

  _rotateElementsTo(chosenElement, rotationAngle) {
    const chosenElementIndex = [...this.circleElements].findIndex(el => el === chosenElement);

    const resultAngles = [...this.circleElements].map((element, elementIndex) => {
      return rotationAngle - (chosenElementIndex - elementIndex) * this.settings.rotationStep;
    });

    if (resultAngles[0] > this.zeroRotation || resultAngles[resultAngles.length - 1] < this.zeroRotation) {
      return;
    }

    this.circleElements.forEach((element, elementIndex) => {
      let resultAngle = resultAngles[elementIndex];
      const visibility = this._getVisibility(resultAngle);

      const wrapper = element.querySelector('.circle-selector__wrapper');

      element.style.transform = `rotate(${resultAngle}deg) skew(${90 - this.settings.rotationStep}deg)`;
      element.dataset.rotation = `${resultAngle - this.zeroRotation}`;
      wrapper.style.transform = `skew(${-(90 - this.settings.rotationStep)}deg)`;

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

    this._onValueChange();
    if (this.settings.progressBar) {
      this._updateProgressBar();
    }
  };

  _selectElement(direction = 'next') {
    /* direction: 'next' or 'prev' */
    const selectedElement = this._getSelectedElement();
    const selectedElementIndex = [...this.circleElements].findIndex((element) => {
      return element === selectedElement;
    });

    let elementIndexToSelect = 0;
    switch (direction) {
      case 'next': {
        if (selectedElementIndex + 1 > this.circleElements.length - 1) {
          return;
        } else {
          elementIndexToSelect = selectedElementIndex + 1;
        }
        break;
      }
      case 'prev': {
        if (selectedElementIndex - 1 < 0) {
          return;
        } else {
          elementIndexToSelect = selectedElementIndex - 1;
        }
        break;
      }
      default: {
        return;
      }
    }

    const elementToSelect = [...this.circleElements][elementIndexToSelect];
    this._rotateElementsTo(elementToSelect, this.zeroRotation);
  }

  _clickHandler(evt) {
    evt.preventDefault();

    const target = evt.target;
    this._rotateElementsTo(target.closest('.circle-selector__element'), this.zeroRotation);
  };

  _attachMouseHandlers(element) {
    const wrapper = element.querySelector('.circle-selector__wrapper');

    const mouseDownHandler = (evt) => {
      evt.preventDefault();

      this._applyTransition(false);
      const containerCenter = getRectCenter(this.circle);

      let startCoords = {
        x: evt.clientX - containerCenter.x,
        y: evt.clientY - containerCenter.y,
      };
      let startRotation = this._getRotationAngle(startCoords);

      const mouseMoveHandler = (moveEvt) => {
        moveEvt.preventDefault();

        wrapper.removeEventListener('click', this._clickHandler);
        const currentRotation = parseFloat(element.dataset.rotation) + this.zeroRotation;

        const endCoords = {
          x: moveEvt.clientX - containerCenter.x,
          y: moveEvt.clientY - containerCenter.y,
        };
        const endRotation = currentRotation - (startRotation - this._getRotationAngle(endCoords));

        startCoords = {
          x: moveEvt.clientX - containerCenter.x,
          y: moveEvt.clientY - containerCenter.y,
        };
        startRotation = this._getRotationAngle(startCoords);

        requestAnimationFrame(() => {
          this._rotateElementsTo(element, endRotation);
        });
      };

      const mouseUpHandler = (upEvt) => {
        upEvt.preventDefault();

        this._applyTransition(true);
        this._completeRotation();
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };

      wrapper.addEventListener('click', this._clickHandler);
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    };

    wrapper.addEventListener('click', this._clickHandler);
    wrapper.addEventListener('mousedown', mouseDownHandler);
  }

  _attachTouchHandlers(element) {
    const wrapper = element.querySelector('.circle-selector__wrapper');

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

        const currentRotation = parseFloat(element.dataset.rotation) + this.zeroRotation;

        const endCoords = {
          x: moveEvt.targetTouches[0].clientX - containerCenter.x,
          y: moveEvt.targetTouches[0].clientY - containerCenter.y,
        };
        const endRotation = currentRotation - (startRotation - this._getRotationAngle(endCoords));

        startCoords = {
          x: moveEvt.targetTouches[0].clientX - containerCenter.x,
          y: moveEvt.targetTouches[0].clientY - containerCenter.y,
        };
        startRotation = this._getRotationAngle(startCoords);

        requestAnimationFrame(() => {
          this._rotateElementsTo(element, endRotation);
        });
      };

      const touchEndHandler = (upEvt) => {
        if (this._clicked) {
          this._clickHandler(upEvt);
        }

        this._applyTransition(true);
        this._completeRotation();
        wrapper.removeEventListener('touchmove', touchMoveHandler);
        wrapper.removeEventListener('touchend', touchEndHandler);
      };

      wrapper.addEventListener('touchmove', touchMoveHandler);
      wrapper.addEventListener('touchend', touchEndHandler);
    };

    wrapper.addEventListener('touchstart', touchStartHandler);
  }

  _attachFocusHandler() {
    const keyDownHandler = (evt) => {
      const key = evt.key;

      if (!this._isTransitioned) {
        this._applyTransition(true);
      }
      if (key === 'ArrowUp') {
        this._selectElement('prev');
      } else if (key === 'ArrowDown') {
        this._selectElement('next');
      }
    };

    this.container.addEventListener('focus', () => {
      document.addEventListener('keydown', keyDownHandler);
    });

    this.container.addEventListener('blur', () => {
      document.removeEventListener('keydown', keyDownHandler);
    });
  }
}
