'use client';
import {useLanguage} from "./language";

import {HOTELS} from '../lib/game/engine';

export function HotelPoster({ landing = false, hidden = false, id }: {
  landing?: boolean;
  hidden?: boolean;
  id?: string;
}) {
  const {t} = useLanguage();

  const fourSeasonsLogo = `url("${HOTELS[2].logo}")`;
  return <div id={id} className={'city-panorama branded-hotel-panorama' + (landing ? ' landing-hotel-poster' : '')}
    role="img" aria-label={t("酒店夜景插畫", "Illustrated hotel night scene")} hidden={hidden}>
    <div className="hotel-poster-stage" aria-hidden="true">
      <img src={landing ? '/art/hotel-dusk-oil.webp' : '/art/peninsula-okura-night-v3.png'} alt="" draggable={false} />
      <span className="hotel-poster-sign peninsula-sign">THE PENINSULA</span>
      <span className="hotel-poster-sign four-seasons-sign">
        <span style={{maskImage: fourSeasonsLogo, WebkitMaskImage: fourSeasonsLogo}}/>
      </span>
    </div>
  </div>;
}
