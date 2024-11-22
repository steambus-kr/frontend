class NotImplementedError extends Error {}

const PAGE_TRANSITION_MS = 200;

export default class BasePage {
  pageId;
  pageTitle;
  pageRoot;
  skipUnmountAnimation;

  constructor(pageId, pageTitle, config = {}) {
    this.pageId = pageId;
    this.pageTitle = pageTitle;
    this.pageRoot = null;
    this.loadCss = config.loadCss ?? true;
    this.skipUnmountAnimation = config.skipUnmountAnimation ?? false;

    // manually triggered
    // void this.mount();
  }

  isMounted() {
    return !!this.pageRoot;
  }

  /**
   * @internal
   */
  async cssInject() {
    if (!this.loadCss) return;
    const styleSheet = await fetch(`/pageStyle/${this.pageId}.css`);
    if (!styleSheet.ok) throw new Error("Stylesheet not loaded");
    const cssText = await styleSheet.text();
    const style = document.createElement("style");
    style.id = `stylesheet-${this.pageId}`;
    style.type = "text/css";
    style.innerHTML = cssText;
    document.head.appendChild(style);
  }

  /**
   * @internal
   */
  async cssRemove() {
    if (!this.loadCss) return;
    document.querySelector(`#stylesheet-${this.pageId}`).remove();
  }

  /**
   * @internal
   */
  async mountHead() {
    document.title = this.pageTitle;
    await this.cssInject();
  }

  /**
   * @internal
   */
  async unmountHead() {
    await this.cssRemove();
  }

  /**
   * 마운트 시점
   */
  async mount(callbacks = {}) {
    if (this.pageRoot) {
      console.warn(`Page ${this.pageId} is already mounted.`);
      return;
    }
    await this.mountHead();
    if (callbacks.onPreload) {
      await callbacks.onPreload();
    }
    this.pageRoot = await this.mountContent();
    if (callbacks.onContentReady) {
      await callbacks.onContentReady();
    }
    await this.mountAnimationSetup();
    document.querySelector("#root").appendChild(this.pageRoot);
    await this.mountAnimationTrigger();
    if (callbacks.onMount) {
      await callbacks.onMount();
    }
  }

  async mountContent() {
    throw new NotImplementedError();
  }

  /* NOTE: 마운트 애니메이션은 entrypoint.css의 @starting-style at-role에 의해 정의됨 */

  async mountAnimationSetup() {}

  async mountAnimationTrigger() {}

  /**
   * 언마운트 시점
   */
  async unmount() {
    if (!this.pageRoot) {
      console.warn(`Page ${this.pageId} is not mounted.`);
      return;
    }
    if (!this.skipUnmountAnimation) {
      await this.unmountAnimationSetup();
      await this.unmountAnimationTrigger();
    }
    await this.unmountContent();
    document.querySelector("#root").removeChild(this.pageRoot);
    await this.unmountHead();
    this.pageRoot = null; // 항상 마지막이어야 함
  }

  async unmountContent() {
    throw new NotImplementedError();
  }

  async unmountAnimationSetup() {
    this.pageRoot.style.transition = `opacity ${PAGE_TRANSITION_MS}ms ease-in-out`;
    this.pageRoot.style.opacity = "1";
  }

  unmountAnimationTrigger() {
    this.pageRoot.style.opacity = "0";
    return new Promise((r) => {
      setTimeout(r, PAGE_TRANSITION_MS);
    });
  }
}

export class LoadingPage extends BasePage {
  constructor() {
    super("loading", "Steambus", {
      loadCss: false,
      skipUnmountAnimation: true,
    });
  }

  async mountContent() {
    const svg = document.createElement("svg");
    svg.classList.add("loading");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.innerHTML = `<path fill="currentColor" d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8"/>`;
    return svg;
  }

  async unmountContent() {}
}
