export const renderHTML = (html) => {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();
  return wrapper.children[0];
};

export const getRect = (element) => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height
  };
};

export const getRectCenter = (element) => {
  const rect = getRect(element);
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
};

export const sin = (arg) => {
  return Math.sin((arg) * Math.PI / 180);
};

export const animate = (draw, duration) => {
  const start = performance.now();

  requestAnimationFrame(function animate(time) {
    let timeFraction = (time - start) / duration;
    if (timeFraction > 1) {
      timeFraction = 1;
    } else if (timeFraction < 0) {
      timeFraction = 0;
    }

    draw(timeFraction);

    if (timeFraction < 1) {
      requestAnimationFrame(animate);
    }
  });
};
