export class Linker {
  /**
   * 페이지 클래스 인스턴스
   */
  pageRef;

  /**
   * 고민중
  constructor() {
    this.overrideAnchor();
  }
   *
   */

  /**
   * anchor href -> script url
   *
   * @param href
   */
  resolveScriptPath(href) {
    let base = "/pageScripts";
    if (!href.startsWith("/")) {
      base += "/";
    }
    return `${base}${href}.js`;
  }

  /**
   * 페이지 로드
   *
   * @param {string} href
   */
  loadPage(href) {
    import(this.resolveScriptPath(href)).then((Page) => {
      this.pageRef = new Page();
    });
  }

  /**
   * Init - 앵커 이벤트 덮어쓰기
   */
  overrideAnchor() {
    document.querySelectorAll("a").forEach((el) =>
      el.addEventListener("click", (e) => {
        if (e.currentTarget.href.startsWith("https://")) {
          return;
          // skip
        }
        e.preventDefault();
        this.loadPage(e.currentTarget.href);
      }),
    );
  }
}
