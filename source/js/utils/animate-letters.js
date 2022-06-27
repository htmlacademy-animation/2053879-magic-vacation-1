const DEFAULT_MAX_ANIMATION_DELAY = 0.5;
const DEFAULT_MIN_ANIMATION_DELAY = 0;

// Анимация для букв в текстовом узле
export const animateLetters = (
  node,
  config,
  delayConfig = {
    min: DEFAULT_MIN_ANIMATION_DELAY,
    max: DEFAULT_MAX_ANIMATION_DELAY,
  }
) => {
  const text = node.innerText;
  const words = text.split(/\s/g);

  node.innerHTML = ``;

  for (let i = 0; i < words.length; i++) {
    // Нода для слова, содержащия ноды с буквами
    const wordNode = document.createElement(`span`);
    const word = words[i];

    word.split(``).forEach((letter) => {
      // Нода для одной буквы
      const letterNode = document.createElement(`span`);

      letterNode.innerHTML = letter;
      letterNode.classList.add(`animated-letter`);

      Object.keys(config).forEach((key) => {
        const value = config[key];

        letterNode.style[key] = value;
      });

      const { min, max } = delayConfig;

      const delay = (Math.random() * (max - min) + min).toFixed(2);

      letterNode.style[`animation-delay`] = `${delay}s`;

      wordNode.appendChild(letterNode);
    });

    node.appendChild(wordNode);

    // Добавим пробел между словами
    if (i !== words.length - 1) {
      node.insertAdjacentHTML(`beforeend`, ` `);
    }
  }
};
