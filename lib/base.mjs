class NotImplementedError extends Error {}

const PAGE_TRANSITION_MS = 200;

export default class BasePage {
  pageId;
  pageTitle;
  pageRoot;
  skipUnmountAnimation;
  revokeEvent = false;
  isMounting = false;
  /**
   * @type {[Element, Element][]}
   */
  mountQueue = [];

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

  revoke() {
    this.revokeEvent = true;
    if (!this.isMounting && this.isMounted())
      this.unmount().then(() => (this.revokeEvent = false));
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
    style.innerHTML = cssText;
    await this.addElement(style, document.head)
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

  async addElement(element, parent = document.querySelector("#root")) {
    this.mountQueue.push([element, parent]);
  }

  /**
   * 마운트 시점
   */
  async mount(
    callbacks = {
      onPreload: null,
      onContentReady: null,
      onMount: null,
    },
  ) {
    if (this.isMounting) return;
    this.isMounting = true;
    if (this.pageRoot) {
      console.warn(`Page ${this.pageId} is already mounted.`);
      return;
    }
    await this.mountHead();
    if (callbacks.onPreload) {
      await callbacks.onPreload();
    }
    this.pageRoot = await this.mountContent();
    this.pageRoot.classList.add("page");
    await this.addElement(this.pageRoot);
    if (callbacks.onContentReady) {
      await callbacks.onContentReady();
    }
    await this.mountAnimationSetup();
    if (!this.revokeEvent) {
      for (const [element, parent] of this.mountQueue) {
        parent.appendChild(element);
      }
    } else {
      await this.unmountContent();
      this.mountQueue = [];
      this.pageRoot = null;
      this.revokeEvent = false;
    }
    await this.mountAnimationTrigger();
    if (callbacks.onMount) {
      await callbacks.onMount();
    }
    this.isMounting = false;
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
      if (this.isMounting) {
        this.revoke();
      } else {
        console.warn(`Page ${this.pageId} is not mounted.`);
      }
      return;
    }
    if (!this.skipUnmountAnimation || this.revokeEvent) {
      await this.unmountAnimationSetup();
      await this.unmountAnimationTrigger();
    }
    await this.unmountContent();
    for (const [element, parent] of this.mountQueue) {
      parent.removeChild(element);
    }
    this.mountQueue = [];
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
      skipUnmountAnimation: false,
    });
  }

  async mountContent() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("loading");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("d", "M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8")
    svg.appendChild(path);
    return svg;
  }

  async unmountContent() {}
}
