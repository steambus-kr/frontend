class NotImplementedError extends Error {}

const PAGE_TRANSITION_MS = 200;

type ArrayElement<T> = T extends (infer I)[] ? I : never;

/**
 * 이벤트를 컨트롤할 수 있는 컨트롤러입니다.
 *
 * @example
 * const evtCtl = new EventController<EventList>();
 * evtCtl.on("event", eventHandler);
 */
export class EventController<Events extends Record<string, any>> {
  listeners: {
    [EventName in keyof Events]?: ((e: Events[EventName]) => void)[]
  } = {}

  /**
   * 특정 이벤트에 대한 리스너를 추가합니다.
   */
  on(event: keyof Events, listener: ArrayElement<typeof this.listeners[keyof Events]>) {
    if (!Array.isArray(this.listeners[event])) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  /**
   * 이벤트를 실행합니다.
   * 이 컨트롤러 인스턴스에 등록되어 있는 특정 이벤트 리스너가 즉시 전부 실행됩니다.
   */
  dispatch<K extends keyof Events>(event: K, data: Events[K]) {
    if (!Array.isArray(this.listeners[event])) {
      return;
    }
    this.listeners[event].forEach(listener => listener(data));
  }
}

export class MountQueue {
  queue: [HTMLElement, HTMLElement][] = [];

  addElement(node: HTMLElement, parent: HTMLElement = document.querySelector("#root")!) {
    this.queue.push([node, parent]);
  }

  buildQueue() {
    for (const [element, parent] of this.queue) {
      parent.appendChild(element);
    }
  }

  destroyQueue() {
    for (const [element, parent] of this.queue) {
      parent.removeChild(element);
    }
    this.emptyQueue();
  }

  emptyQueue() {
    this.queue = [];
  }
}

interface BasePageMountEvent {
  preload: {};
  contentready: {};
  mount: {};
}
interface BasePageUnmountEvent {
  afteranimation: {};
  unmount: {};
}
export default class BasePage {
  pageId: string;
  pageTitle: string;
  pageRoot: HTMLElement | null = null;
  config: {
    loadCSS: boolean;
    skipUnmountAnimation: boolean;
    skipPageClass: boolean;
    preventState: boolean;
  };
  revokeEvent: boolean = false;
  isMounting: boolean = false;

  mountQueue: MountQueue = new MountQueue();

  constructor(pageId: string, pageTitle: string, config?: Partial<typeof this.config>) {
    this.pageId = pageId;
    this.pageTitle = pageTitle;
    this.config = {
      loadCSS: true,
      skipUnmountAnimation: false,
      skipPageClass: false,
      preventState: false,
      ...(config ?? {}),
    };
  }

  isMounted() {
    return !!this.pageRoot;
  }

  revoke() {
    this.revokeEvent = true;
    if(!this.isMounting && this.isMounted())
      this.unmount().then(() => (this.revokeEvent = false));
  }

  /**
   * CSS를 로드하고 HTML에 스타일 태그로 삽입합니다.
   * 페이지 마운트 시점, 페이지 컨텐츠 로드 전 호출됩니다.
   *
   * @internal
   */
  async injectCSS() {
    if (!this.config.loadCSS) return;
    const styleSheet = await fetch(`/styles/${this.pageId}.css`);
    if (!styleSheet.ok) throw new Error("Stylesheet not loaded");
    const cssText = await styleSheet.text();
    const style = document.createElement("style");
    style.id = `stylesheet-${this.pageId}`;
    style.innerHTML = cssText;
    this.mountQueue.addElement(style, document.head)
  }

  /**
   * HTML을 로드합니다.
   */
  async loadHTML(filename: string) {
    return await fetch(`/pages/${filename}.html`).then((r) => r.text());
  }

  /**
   * 페이지를 마운트합니다.
   * 이벤트 순서는 다음과 같습니다
   *
   * 1. preload - CSS를 주입합니다.
   * 2. contentready - 메인 컨텐츠(HTML 및 서버 데이터)를 준비합니다.
   * 3. mount - 페이지 마운트를 마무리합니다.
   * @param evtCtl
   */
  async mount(evtCtl?: EventController<BasePageMountEvent>) {
    if (this.isMounting) return;
    this.isMounting = true;

    if (this.pageRoot) {
      return;
    }

    await this.injectCSS();
    evtCtl && evtCtl.dispatch('preload', {});

    this.pageRoot = await this.mountContent();
    if (!this.config.skipPageClass) {
      this.pageRoot.classList.add("page");
    }
    this.mountQueue.addElement(this.pageRoot);
    evtCtl && evtCtl.dispatch("contentready", {});

    if (!this.revokeEvent) {
      this.mountQueue.buildQueue();
    } else {
      await this.unmountContent();
      this.mountQueue.emptyQueue();
      this.pageRoot = null;
      this.revokeEvent = false;
    }

    evtCtl && evtCtl.dispatch("mount", {});

    this.isMounting = false;
  }

  /**
   * 이 함수를 오버라이드하여 메인 컨텐츠를 로드하는 코드를 작성
   */
  async mountContent(): Promise<HTMLElement> {
    throw new NotImplementedError();
  }

  /**
   * 페이지를 언마운트합니다.
   * 이벤트 순서는 다음과 같습니다.
   *
   * 1. afteranimation - 언마운트 애니메이션이 종료된 뒤
   * (어떠한 조건으로라도 애니메이션이 아예 실행되지 않았다면 이벤트가 발생하지 않습니다.)
   * 2. unmount - 언마운트 작업이 마무리된 뒤
   */
  async unmount(evtCtl?: EventController<BasePageUnmountEvent>) {
    if (!this.pageRoot) {
      if (this.isMounting) {
        this.revoke();
      } else {
        console.warn(`Page ${this.pageId} is not mounted`);
      }
      return;
    }

    if (!this.config.skipUnmountAnimation && !this.revokeEvent) {
      this.pageRoot.style.transition = `opacity ${PAGE_TRANSITION_MS}ms ease-in-out`;
      this.pageRoot.style.opacity = "0";
      await new Promise(resolve => setTimeout(resolve, PAGE_TRANSITION_MS));
      evtCtl && evtCtl.dispatch("afteranimation", {});
    }

    await this.unmountContent();
    this.mountQueue.destroyQueue();
    this.pageRoot = null;
    evtCtl && evtCtl.dispatch("unmount", {});
  }

  /**
   * 이 함수를 오버라이드하여 클래스를 초기화하는 코드를 작성
   * note: 이 함수에서 mountQueue에 포함된 요소를 삭제하면 안됩니다
   */
  async unmountContent(): Promise<void> {
    throw new NotImplementedError();
  }
}

export class LoadingPage extends BasePage {
  constructor() {
    super("loading", "Steambus", {
      loadCSS: false,
      skipPageClass: true,
    })
  }

  async mountContent() {
    const loading = document.createElement("div");
    loading.classList.add("loading");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("d", "M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8")
    svg.appendChild(path);
    return loading;
  }

  async unmountContent() {}
}

export class Linker {
  pageRef: BasePage[] = [];
  loadingPage;

  constructor() {
    this.loadingPage = new LoadingPage();
    window.addEventListener("popstate", () => this.popState())
  }

  popState() {
    if (this.pageRef.length === 0) return;
    this.pageRef.pop()!.unmount().then(async () => {
      if (this.pageRef.length > 0) {
        await this.pageRef.at(-1)!.mount();
      }
    });
  }

  /**
   * Anchor href -> script URL
   *
   * @param href
   */
  resolveScriptPath(href: keyof typeof pageMap) {
    let base = "/scripts/pages";
    if (!Object.keys(pageMap).includes(href))
      throw new Error(`Link Not Found (${href})`);
    return `${base}/${pageMap[href]}`;
  }

  /**
   * 페이지 로드 엔트리
   *
   * @param href
   * @param searchParam
   */
  loadPage(href: keyof typeof pageMap, searchParam?: URLSearchParams) {
    import(this.resolveScriptPath(href)).then(async ({ default: Page }) => {
      if (this.pageRef.length > 0) {
        await this.pageRef.at(-1)!.unmount();
      }
      if (!this.loadingPage.isMounted()) {
        await this.loadingPage.mount();
      }

      const page = new Page(searchParam);
      this.pageRef.push(page);
      if (!page.preventState) {
        window.history.pushState({}, "", href);
      }

      const e = new EventController<BasePageMountEvent>();
      e.on("contentready", async () => {
        await this.loadingPage.unmount();
        this.overrideAnchor(page.pageRoot);
      })
      await page.mount(e);
    })
  }

  /**
   * 앵커 <a> 이벤트 덮어쓰기
   */
  overrideAnchor(base = document.body) {
    base.querySelectorAll("a").forEach((el) => {
      el.addEventListener("click", (e) => {
        const anchor = e.currentTarget as HTMLAnchorElement
        if (anchor.dataset.outside) return;
        e.preventDefault();
        const url = new URL(anchor.href);
        this.loadPage(url.pathname as keyof typeof pageMap, url.searchParams);
      })
    })
  }
}

export const pageMap = {
  "/": "index.js",
  "/history": "history.js",
  "/settings": "settings.js",
  "/game": "game.js",
  "/404": "404.js"
}