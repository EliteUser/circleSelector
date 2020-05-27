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
