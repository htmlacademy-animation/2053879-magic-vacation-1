import throttle from "lodash/throttle";

import { animateLetters } from "../utils/animate-letters";

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

    const currentId = this.screenElements[this.activeScreen].id;

    this.animatePageLetters(currentId);
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

    const prevElementClassList =
      this.screenElements[this.activeScreen].classList;

    // Если у предыдущего элемента остался класс animation-in-progress,
    // значит анимация не успела отработать, поэтому уберем его
    if (prevElementClassList.contains(`animation-in-progress`)) {
      prevElementClassList.remove(`animation-in-progress`);
    }

    this.hashHistory.push(this.screenElements[this.activeScreen].id);
    this.activeScreen = newIndex < 0 ? 0 : newIndex;

    this.changePageDisplay();
  }

  changePageDisplay() {
    this.changeVisibilityDisplay();
    this.changeActiveMenuItem();
    this.emitChangeDisplayEvent();
  }

  changeVisibilityDisplay() {
    if (this.animationTimeout) {
      window.clearTimeout(this.animationTimeout);
    }

    const prevHash = this.hashHistory[this.hashHistory.length - 1];
    const currentId = this.screenElements[this.activeScreen].id;

    if (currentId === `prizes` && prevHash === `story`) {
      // Добавим сразу класс active, чтобы запустить анимацию
      this.screenElements[this.activeScreen].classList.add(
        `animation-in-progress`
      );

      // Запустим таймер, чтобы сначала отработала анимация для показывания блока,
      // а затем уже поменяем контент страницы
      this.animationTimeout = window.setTimeout(() => {
        this.screenElements.forEach((screen) => {
          screen.classList.add(`screen--hidden`);
          screen.classList.remove(`active`);
        });

        this.screenElements[this.activeScreen].classList.remove(
          `screen--hidden`
        );

        this.screenElements[this.activeScreen].classList.remove(
          `animation-in-progress`
        );
      }, 1000);

      return;
    }

    this.animatePageLetters(currentId);

    this.screenElements.forEach((screen) => {
      screen.classList.add(`screen--hidden`);
      screen.classList.remove(`active`);
    });

    this.screenElements[this.activeScreen].classList.remove(`screen--hidden`);

    if (this) {
      setTimeout(() => {
        this.screenElements[this.activeScreen].classList.add(`active`);
      }, 100);
    }
  }

  changeActiveMenuItem() {
    const activeItem = Array.from(this.menuElements).find(
      (item) => item.dataset.href === this.screenElements[this.activeScreen].id
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
        screenName: this.screenElements[this.activeScreen].id,
        screenElement: this.screenElements[this.activeScreen],
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
