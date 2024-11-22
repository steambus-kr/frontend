import pageMap from "./pageMap.mjs";
import { LoadingPage } from "./base.mjs";

const loading = new LoadingPage();

export class Linker {
  /**
   * 페이지 클래스 인스턴스
   */
  pageRef = [];

  constructor() {
    window.addEventListener("popstate", (e) => {
      this.popState(e)
    })
  }

  popState(e) {
    if (!loading.isMounted()) {
      if (this.pageRef.length > 1) {
        void loading.mount();
      }
    }
    this.pageRef.pop().unmount().then(async () => {
      if (this.pageRef.length > 0) {
        await this.pageRef.at(-1).mount({
          onContentReady: async () => {
            await loading.unmount();
          },
        });
      }
    });

  }

  /**
   * anchor href -> script url
   *
   * @param href
   */
  resolveScriptPath(href) {
    let base = "/pageScripts";
    if (!Object.keys(pageMap).includes(href))
      throw new Error(`Link Not Found (${href})`);
    return `${base}/${pageMap[href]}`;
  }

  /**
   * 페이지 로드
   * 엔트리
   *
   * @param {string} href
   * @param {URLSearchParams | null} searchParam
   */
  loadPage(href, searchParam) {
    import(this.resolveScriptPath(href)).then(async ({ default: Page }) => {
      if (this.pageRef.length > 0) {
        await this.pageRef.at(-1).unmount();
      }
      if (!loading.isMounted()) {
        await loading.mount();
      }
      const page = new Page(searchParam);
      this.pageRef.push(page);
      window.history.pushState({}, "", href);
      await page.mount({
        onContentReady: async () => {
          await loading.unmount();
        },
      });
    });
  }

  /**
   * Init - 앵커 이벤트 덮어쓰기
   */
  overrideAnchor() {
    document.querySelectorAll("a").forEach((el) =>
      el.addEventListener("click", (e) => {
        if (e.currentTarget.dataset.outside) { // data-outside
          return;
          // skip
        }
        e.preventDefault();
        const url = new URL(e.currentTarget.href);
        this.loadPage(url.pathname, url.searchParams);
      }),
    );
  }
}
