export default () => {
  let emailFields = document.querySelectorAll(`input[type="email"]`);
  let adaptPlaceholder = function (el) {
    const handleChange = () => {
      el.removeEventListener(`animationend`, handleChange);

      if (
        window.innerWidth / window.innerHeight < 1 ||
        window.innerWidth < 769
      ) {
        el.placeholder = `e-mail`;
      } else {
        el.placeholder = `e-mail для регистации результата и получения приза`;
      }
    };

    el.addEventListener(`animationend`, handleChange);
  };

  for (let i = 0; i < emailFields.length; i++) {
    adaptPlaceholder(emailFields[i]);
    window.addEventListener(`resize`, function () {
      adaptPlaceholder(emailFields[i]);
    });
  }
};
