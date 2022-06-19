export default () => {
  window.addEventListener(`load`, () => {
    document.body.classList.add(`loaded`);
  }, {once: true});
};
