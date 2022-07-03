import throttle from "lodash/throttle";

import { animateLetters } from "../utils/animate-letters";

const SCREEN_ID_BY_HASH = {
  top: 0,
  story: 1,
  prizes: 2,
  rules: 3,
  game: 4,
};

const SHOW_HIDDEN_BLOCK_ANIMATION_NAME = `animating-block`;
const SHOW_TEXT_WITH_OPACITY_ANIMATION_NAME = `animating-text`;
const SHOW_TEXT_WITH_OPACITY_REVERSE_ANIMATION_NAME = `animating-text-reverse`;

// Список анимации, которые применяются к страницам при переключении
const ANIMATION_NAMES_ON_PAGE_CHANGING = [
  SHOW_HIDDEN_BLOCK_ANIMATION_NAME,
  SHOW_TEXT_WITH_OPACITY_ANIMATION_NAME,
  SHOW_TEXT_WITH_OPACITY_REVERSE_ANIMATION_NAME,
];

export default class FullPageScroll {
  constructor() {
    this.THROTTLE_TIMEOUT = 1000;
    this.scrollFlag = true;
    this.timeout = null;
    this.animationTimeout = null;

    this.screenElements = document.querySelectorAll(
      `.screen:not(.screen--result)`
    );

    this.menuElements = document.querySelectorAll(
      `.page-header__menu .js-menu-link`
    );

    this.animationLayout = document.querySelector(`.animation_layout`);

    this.activeScreen = 0;
    this.onScrollHandler = this.onScroll.bind(this);
    this.onUrlHashChengedHandler = this.onUrlHashChanged.bind(this);

    // Будем отслеживать историю смены хешей для анимации
    this.hashHistory = [];
  }

  init() {
    document.addEventListener(
      `wheel`,
      throttle(this.onScrollHandler, this.THROTTLE_TIMEOUT, { trailing: true })
    );

    window.addEventListener(`popstate`, this.onUrlHashChengedHandler);

    this.onUrlHashChanged();

    const currentId = this.activeScreenEl.id;

    this.animatePageLetters(currentId);

    this.addAnimationCancelSubscriptions();
  }

  // Если анимация была отменена, уберем все классы, которые
  // запускают ее при смене страницы.
  clearAnimatingClasses(event) {
    const { currentTarget: target } = event;

    if (!target) {
      return;
    }

    target.classList.forEach((className) => {
      if (ANIMATION_NAMES_ON_PAGE_CHANGING.includes(className)) {
        target.classList.remove(className);
      }
    });
  }

  // Убирает классы с body, которые добавляюстся при смене слайдов истории
  removeBodyThemeClasses() {
    if (document.body.classList.contains(`t-light-blue`)) {
      document.body.classList.remove(`t-light-blue`);
    }

    if (document.body.classList.contains(`t-blue`)) {
      document.body.classList.remove(`t-blue`);
    }
  }

  addAnimationCancelSubscriptions() {
    this.screenElements.forEach((screen) => {
      screen.addEventListener(`animationcancel`, this.clearAnimatingClasses);
    });
  }

  getScreenIdByHash(hash) {
    return SCREEN_ID_BY_HASH[hash] || 0;
  }

  get prevHash() {
    return this.hashHistory[this.hashHistory.length - 1];
  }

  get activeScreenEl() {
    return this.screenElements[this.activeScreen];
  }

  animatePageLetters(id) {
    if (!id || id === `top`) {
      this.animateMainPage();
    } else {
      let node;

      switch (id) {
        case `story`: {
          node = document.querySelector(`.slider__item-title`);
          break;
        }

        case `rules`: {
          node = document.querySelector(`.rules__title`);
          break;
        }

        case `prizes`: {
          node = document.querySelector(`.prizes__title`);
          break;
        }

        case `game`: {
          node = document.querySelector(`.game__title`);
          break;
        }
      }

      this.animatePageNode(node);
    }
  }

  animatePageNode(node) {
    if (!node) {
      return;
    }

    animateLetters(node, {
      "animation-timing-function": `ease-out`,
      "animation-duration": `0.8s`,
      "animation-fill-mode": `both`,
    });
  }

  animateMainPage() {
    const titleNode = document.querySelector(`.intro__title`);
    const dateNode = document.querySelector(`.intro__date`);

    if (titleNode) {
      animateLetters(titleNode, {
        "animation-timing-function": `ease-out`,
        "animation-duration": `1s`,
        "animation-fill-mode": `both`,
      });
    }

    if (dateNode) {
      animateLetters(
        dateNode,
        {
          "animation-timing-function": `ease-out`,
          "animation-duration": `1s`,
          "animation-fill-mode": `both`,
        },
        { min: 1.5, max: 2 }
      );
    }
  }

  onScroll(evt) {
    if (this.scrollFlag) {
      this.reCalculateActiveScreenPosition(evt.deltaY);

      const currentPosition = this.activeScreen;

      if (currentPosition !== this.activeScreen) {
        this.changePageDisplay();
      }
    }

    this.scrollFlag = false;

    if (this.timeout !== null) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.scrollFlag = true;
    }, this.THROTTLE_TIMEOUT);
  }

  onUrlHashChanged() {
    const newIndex = Array.from(this.screenElements).findIndex(
      (screen) => location.hash.slice(1) === screen.id
    );

    this.hashHistory.push(this.activeScreenEl.id);
    this.activeScreen = newIndex < 0 ? 0 : newIndex;

    this.changePageDisplay();
  }

  changePageDisplay() {
    this.changeVisibilityDisplay();
    this.changeActiveMenuItem();
    this.emitChangeDisplayEvent();
  }

  madeAllScreensHidden() {
    this.screenElements.forEach((screen) => {
      screen.classList.add(`screen--hidden`);
      screen.classList.remove(`active`);
    });
  }

  removeClasses(screenId, ...classNames) {
    classNames.forEach((className) =>
      this.screenElements[screenId].classList.remove(className)
    );
  }

  addClasses(screenId, ...classNames) {
    classNames.forEach((className) =>
      this.screenElements[screenId].classList.add(className)
    );
  }

  // Показываем скрытый блок, который перекрывает контент
  animateHiddenBlock() {
    // Уберем анимирующий класс, если изменился экран во время анимации
    const screenChanged = () => {
      const prizesScreen =
        this.screenElements[this.getScreenIdByHash(`prizes`)];

      document.body.removeEventListener(`screenChanged`, screenChanged);

      if (prizesScreen.classList.contains(SHOW_HIDDEN_BLOCK_ANIMATION_NAME)) {
        prizesScreen.classList.remove(SHOW_HIDDEN_BLOCK_ANIMATION_NAME);
      }
    };

    // Добавим сразу класс active, чтобы запустить анимацию
    this.addClasses(this.activeScreen, SHOW_HIDDEN_BLOCK_ANIMATION_NAME);

    const animationEnd = () => {
      document.body.removeEventListener(`screenChanged`, screenChanged);
      this.animationLayout.removeEventListener(`animationend`, animationEnd);

      this.madeAllScreensHidden();

      this.removeClasses(
        this.activeScreen,
        `screen--hidden`,
        SHOW_HIDDEN_BLOCK_ANIMATION_NAME
      );
    };

    // На старте анимации будем слушать screenChanged, если стриггерится
    // значит анимация не успела отработать
    const animationStart = () => {
      document.body.addEventListener(`screenChanged`, screenChanged);
    };

    this.animationLayout.addEventListener(`animationend`, animationEnd);
    this.animationLayout.addEventListener(`animationstart`, animationStart);
  }

  // Анимируем текст футера при помощи опасити
  animateFooterText(animationName) {
    const prevScreenId = SCREEN_ID_BY_HASH[this.prevHash];

    // Добавим сразу класс active на страницу с которой уходит, чтобы запустить анимацию
    this.addClasses(prevScreenId, animationName);

    this.animationTimeout = window.setTimeout(() => {
      this.madeAllScreensHidden();

      this.removeClasses(this.activeScreen, `screen--hidden`);
      this.removeClasses(prevScreenId, animationName);

      this.addClasses(this.activeScreen, animationName, `active`);

      const animationEnd = () => {
        this.activeScreenEl.removeEventListener(`animationend`, animationEnd);

        this.removeClasses(this.activeScreen, animationName);
      };

      this.activeScreenEl.addEventListener(`animationend`, animationEnd);
    }, 500);
  }

  changeVisibilityDisplay() {
    if (this.animationTimeout) {
      window.clearTimeout(this.animationTimeout);
    }

    const currentId = this.activeScreenEl.id;

    if (this.prevHash === `story`) {
      this.removeBodyThemeClasses();
    }

    // Перешли со страницы история на призы
    if (currentId === `prizes` && this.prevHash === `story`) {
      this.animateHiddenBlock();

      return;
    }

    // Перешли со страницы правила на призы
    if (currentId === `rules` && this.prevHash === `prizes`) {
      this.animateFooterText(SHOW_TEXT_WITH_OPACITY_ANIMATION_NAME);

      return;
    }

    // Перешли со страницы призы на правила
    if (currentId === `prizes` && this.prevHash === `rules`) {
      this.animateFooterText(SHOW_TEXT_WITH_OPACITY_REVERSE_ANIMATION_NAME);

      return;
    }

    this.animatePageLetters(currentId);
    this.madeAllScreensHidden();
    this.removeClasses(this.activeScreen, `screen--hidden`);

    if (this) {
      setTimeout(() => {
        this.addClasses(this.activeScreen, `active`);
      }, 100);
    }
  }

  changeActiveMenuItem() {
    const activeItem = Array.from(this.menuElements).find(
      (item) => item.dataset.href === this.activeScreenEl.id
    );

    if (activeItem) {
      this.menuElements.forEach((item) => item.classList.remove(`active`));
      activeItem.classList.add(`active`);
    }
  }

  emitChangeDisplayEvent() {
    const event = new CustomEvent(`screenChanged`, {
      detail: {
        screenId: this.activeScreen,
        screenName: this.activeScreenEl.id,
        screenElement: this.activeScreenEl,
      },
    });

    document.body.dispatchEvent(event);
  }

  reCalculateActiveScreenPosition(delta) {
    if (delta > 0) {
      this.activeScreen = Math.min(
        this.screenElements.length - 1,
        ++this.activeScreen
      );
    } else {
      this.activeScreen = Math.max(0, --this.activeScreen);
    }
  }
}
