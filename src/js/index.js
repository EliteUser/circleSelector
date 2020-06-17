import CircleSelector from './circleSelector';

const settings = {
  fullCircle: false,

};

const container = document.querySelector('.circle-selector');
const circleSelector = new CircleSelector(container, settings);
circleSelector.render();

circleSelector.input.addEventListener('change', (evt) => {
  document.querySelector('.res').innerText = evt.target.value;
});
