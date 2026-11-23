export function StoryOrnament() {
  return <div className="game-story-ornament" aria-hidden="true">
    <svg className="game-story-ornament-defs" width="0" height="0" focusable="false">
      <defs>
        <g id="story-etched-leaf">
          <path d="M0 0C-1-18 8-36 32-43 33-21 21-5 0 0Z" fill="#283b69" stroke="#5876ad" />
          <path d="M0 0Q15-15 29-39M9-10Q7-18 10-27m5 9 11-2m-6-5 1-10" fill="none" stroke="#879bcb" strokeWidth=".65" />
        </g>
        <g id="story-etched-frond">
          <path d="M0 1Q9-20 0-53" fill="none" stroke="#a28263" />
          <path d="M3-8Q-4-23-13-20-12-10 3-8Zm1-9Q16-32 20-24 17-15 4-17Zm0-9Q-5-36-11-34-9-25 4-26Zm-1-8Q10-49 15-43 12-36 3-34Zm-1-7Q-7-51-9-45-6-39 2-41ZM0-52Q-3-62 1-63 4-61 0-52Z" fill="#526ba2" stroke="#8c9bc1" strokeWidth=".7" />
        </g>
        <g id="story-etched-bloom">
          <path id="story-etched-petal" d="M0 5C-7 0-19-14-15-25-12-33-7-31-3-37 0-42 3-36 7-35 14-33 20-27 15-18 13-10 7-1 0 5Z" fill="#576fb4" stroke="#a7b8e9" strokeWidth="1.1" />
          <use href="#story-etched-petal" transform="rotate(72)" /><use href="#story-etched-petal" transform="rotate(144)" />
          <use href="#story-etched-petal" transform="rotate(216)" /><use href="#story-etched-petal" transform="rotate(288)" />
          <path d="M1-9-3-29M9-3l20-10M5 8l15 16M-6 7l-15 16M-9-3l-20-10" fill="none" stroke="#abbbec" strokeWidth=".86" strokeLinecap="round" />
          <circle r="8" fill="#442f35" stroke="#e4b479" strokeWidth="1.4" />
          <path d="M0-5v10m-5-5h10m-8-3 6 6m0-6-6 6" stroke="#e4b479" strokeWidth=".9" />
        </g>
        <g id="story-etched-bell">
          <path d="M0 0Q13 6 21-4 26-3 28 2 24 9 18 11 15 20 6 24L2 16q-8-2-8-9Z" fill="#434d85" stroke="#9daedf" />
          <path d="M1 3q6 3 5 16M5 3q7 2 11 9M10 2q6 1 12 3" fill="none" stroke="#aebbe7" strokeWidth=".7" />
          <circle cx="6" cy="24" r="1.6" fill="#ddaa72" /><circle cx="19" cy="12" r="1.3" fill="#ddaa72" />
        </g>
        <g id="story-etched-stars" fill="none" stroke="#bd956e" strokeWidth=".9">
          <path d="M0-5v10m-5-5h10M19-17v6m-3-3h6M-10 18v5m-2.5-2.5h5" /><circle cx="12" cy="11" r="1.4" /><circle cx="-19" cy="-12" r="1.2" />
        </g>
        <g id="story-etched-spray">
          <path className="game-story-stem" pathLength="1" d="M10 114c49-6 86-35 99-78m-59 67c-3-29 8-48 33-63m-14 57c27 2 55-8 83-32m-120 44c-23-13-21-42 0-49 14-4 22 6 15 15" fill="none" stroke="#b68d62" strokeWidth="1.35" />
          <use href="#story-etched-leaf" transform="translate(53 96) rotate(-66) scale(.72)" /><use href="#story-etched-leaf" transform="translate(74 92) rotate(99) scale(.93)" />
          <use href="#story-etched-leaf" transform="translate(94 71) rotate(-28) scale(.73)" /><use href="#story-etched-frond" transform="translate(110 84) rotate(84) scale(.69)" />
          <use href="#story-etched-bloom" transform="translate(109 34) rotate(21) scale(.85)" /><use href="#story-etched-bloom" transform="translate(151 66) rotate(-22) scale(.55)" />
          <use href="#story-etched-bell" transform="translate(81 42) rotate(162) scale(.72)" /><use href="#story-etched-stars" transform="translate(57 29)" />
        </g>
      </defs>
    </svg>
    <svg className="game-story-vine" viewBox="0 0 210 770" focusable="false">
      <path className="game-story-stem" pathLength="1" d="M0 722c81-15 156-77 126-157-19-52-96-88-96-151 0-61 88-99 110-151 33-78-51-135-60-181-4-22 7-37 23-50M112 686c64-15 87-45 91-80m-74 11c-38-24-57-10-70 5m47-89c18-42 49-65 89-63M33 448c-20 11-24 29-15 45 12 19 31 20 43 11M48 364c-18-35-24-72-8-114m77 48c37-4 68-19 82-52m-57-21c-30-25-65-34-94-21-19 8-22 28-12 36m77-97c25-30 55-38 83-28m-126-42c-25 1-38 20-33 35 3 10 17 10 22 2M83 749c63-18 115-47 119-110" fill="none" stroke="#bd946b" strokeWidth="1.45" />
      <use href="#story-etched-leaf" transform="translate(37 706) rotate(-69) scale(1.45)" /><use href="#story-etched-leaf" transform="translate(85 679) rotate(87) scale(1.25)" />
      <use href="#story-etched-leaf" transform="translate(121 645) rotate(-55) scale(1.36)" /><use href="#story-etched-leaf" transform="translate(131 609) rotate(75) scale(1.18)" />
      <use href="#story-etched-leaf" transform="translate(112 550) rotate(45) scale(1.43)" /><use href="#story-etched-leaf" transform="translate(88 521) rotate(-88) scale(1.1)" />
      <use href="#story-etched-leaf" transform="translate(32 427) rotate(-39) scale(1.15)" /><use href="#story-etched-leaf" transform="translate(43 383) rotate(83) scale(1.3)" />
      <use href="#story-etched-leaf" transform="translate(84 330) rotate(-62) scale(1.46)" /><use href="#story-etched-leaf" transform="translate(114 302) rotate(57) scale(1.29)" />
      <use href="#story-etched-leaf" transform="translate(146 250) rotate(55) scale(1.22)" /><use href="#story-etched-leaf" transform="translate(146 216) rotate(-64) scale(1.27)" />
      <use href="#story-etched-leaf" transform="translate(119 159) rotate(17) scale(1.38)" /><use href="#story-etched-leaf" transform="translate(88 112) rotate(-74) scale(.94)" />
      <use href="#story-etched-frond" transform="translate(70 690) rotate(-37) scale(1.27)" /><use href="#story-etched-frond" transform="translate(136 648) rotate(61) scale(1.1)" />
      <use href="#story-etched-frond" transform="translate(78 509) rotate(-26) scale(1.04)" /><use href="#story-etched-frond" transform="translate(120 506) rotate(21) scale(.91)" />
      <use href="#story-etched-frond" transform="translate(38 414) rotate(-37) scale(1.08)" /><use href="#story-etched-frond" transform="translate(99 318) rotate(83) scale(.8)" />
      <use href="#story-etched-frond" transform="translate(46 350) rotate(-57) scale(.95)" /><use href="#story-etched-frond" transform="translate(106 141) rotate(-60) scale(.87)" />
      <use href="#story-etched-bloom" transform="translate(45 641) rotate(-21) scale(.86)" /><use href="#story-etched-bloom" transform="translate(163 484) rotate(19) scale(.93)" />
      <use href="#story-etched-bloom" transform="translate(50 287) rotate(11) scale(.82)" /><use href="#story-etched-bloom" transform="translate(100 55) rotate(-12) scale(.72)" />
      <use href="#story-etched-bell" transform="translate(169 275) rotate(-24) scale(.92)" /><use href="#story-etched-bell" transform="translate(25 466) rotate(62) scale(.93)" />
      <use href="#story-etched-bell" transform="translate(170 645) rotate(-17) scale(.85)" /><use href="#story-etched-bell" transform="translate(173 116) rotate(-49) scale(.88)" />
      <use href="#story-etched-stars" transform="translate(147 707)" /><use href="#story-etched-stars" transform="translate(152 542)" /><use href="#story-etched-stars" transform="translate(69 399)" /><use href="#story-etched-stars" transform="translate(170 170)" />
    </svg>
    <svg className="game-story-corner" viewBox="0 0 280 245" focusable="false">
      <path className="game-story-stem" pathLength="1" d="M276 238c-9-80-106-67-142-124-21-34 5-65 34-47 12 8 5 22-5 20m109 123c-44-29-151 10-184-32-16-21 0-44 21-39m107 42q34-20 23-57c-5-15-22-20-33-7" fill="none" stroke="#bd946b" strokeWidth="1.3" />
      <use href="#story-etched-spray" transform="translate(265 227) rotate(174) scale(1.35)" />
      <use href="#story-etched-spray" transform="translate(266 216) scale(-1.03 1) rotate(-27) translate(0 -97)" />
      <use href="#story-etched-stars" transform="translate(53 184)" /><use href="#story-etched-stars" transform="translate(204 73)" />
    </svg>
  </div>;
}

export function StorySpray({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 180 120" aria-hidden="true" focusable="false"><use href="#story-etched-spray" /></svg>;
}