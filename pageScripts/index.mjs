import BasePage from "../lib/base.mjs";

const HTML = `
  <div class="logo mobile-only">
    <svg
            xmlns="http://www.w3.org/2000/svg"
            viewbox="0 0 1024 1024"
    >
      <defs></defs>
      <g>
        <g>
          <g>
            <path
                    d="M512.000000,85.000000C747.612100,85.000000 939.000000,276.387900 939.000000,512.000000 C939.000000,747.612100 747.612100,939.000000 512.000000,939.000000 C276.387900,939.000000 85.000000,747.612100 85.000000,512.000000 C85.000000,276.387900 276.387900,85.000000 512.000000,85.000000 Z"
                    transform=""
                    fill="#ffffff"
                    stroke="#ffffff"
                    stroke-width="2"
            />
            <path
                    d="M100.000000,512.000000C187.111111,478.666667 274.222222,445.333333 368.000000,462.000000 C461.777778,478.666667 562.222222,545.333333 656.000000,562.000000 C749.777778,578.666667 836.888889,545.333333 924.000000,512.000000 "
                    transform="matrix(1,0,0,1,0,100)"
                    fill="none"
                    stroke="#45a1b5"
                    stroke-width="60"
                    stroke-linecap="round"
            />
            <path
                    d="M650.000000,323.000000C722.835591,323.000000 782.000000,379.923333 782.000000,450.000000 C782.000000,520.076667 722.835591,577.000000 650.000000,577.000000 C577.164409,577.000000 518.000000,520.076667 518.000000,450.000000 C518.000000,379.923333 577.164409,323.000000 650.000000,323.000000 Z"
                    transform="matrix(1,0,0,1,0,0)"
                    fill="none"
                    stroke="#45a1b5"
                    stroke-width="60"
            />
            <path
                    d="M512.000000,85.000000C747.612100,85.000000 939.000000,276.387900 939.000000,512.000000 C939.000000,747.612100 747.612100,939.000000 512.000000,939.000000 C276.387900,939.000000 85.000000,747.612100 85.000000,512.000000 C85.000000,276.387900 276.387900,85.000000 512.000000,85.000000 Z"
                    transform=""
                    fill="none"
                    stroke="#45a1b5"
                    stroke-width="120"
            />
          </g>
        </g>
      </g>
    </svg>
    <span>SteamBus</span>
  </div>
  <h1 class="header">무작위 스팀 게임 추천</h1>
  <button class="primary main-start">시작하기</button>
`;

export default class IndexPage extends BasePage {
  constructor() {
    super("index", "Steambus");
  }

  async mountContent() {
    const content = document.createElement("div");
    content.classList.add("page");
    content.innerHTML = HTML;
    return content;
  }

  async unmountContent() {}
}