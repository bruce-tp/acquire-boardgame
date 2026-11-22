/** Shared hotel artwork keeps the entrance screen and game map visually consistent. */
export function HotelPoster({ landing = false, hidden = false, id }: {
  landing?: boolean;
  hidden?: boolean;
  id?: string;
}) {
  return <div id={id} className={'city-panorama branded-hotel-panorama' + (landing ? ' landing-hotel-poster' : '')}
    role="img" aria-label="香港半島酒店與ホテルオークラ · The Peninsula Hong Kong and The Okura Tokyo" hidden={hidden}>
    <div className="hotel-poster-stage" aria-hidden="true">
      <img src={landing ? '/art/hotel-seasons-oil.webp' : '/art/peninsula-okura-night-v3.png'} alt="" draggable={false} />
      <span className="hotel-poster-sign peninsula-sign">THE PENINSULA</span>
      <span className="hotel-poster-sign okura-sign" lang="ja">ホテルオークラ</span>
    </div>
  </div>;
}
