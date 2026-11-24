'use client';
import {useLanguage} from "./language";

export function HotelPoster({ landing = false, hidden = false, id }: {
  landing?: boolean;
  hidden?: boolean;
  id?: string;
}) {
  const {t} = useLanguage();

  return <div id={id} className={'city-panorama branded-hotel-panorama' + (landing ? ' landing-hotel-poster' : '')}
    role="img" aria-label={t("香港半島酒店及香港四季酒店的維港夜景插畫", "Illustration of The Peninsula and Four Seasons Hong Kong at Victoria Harbour")} hidden={hidden}>
    <div className="hotel-poster-stage" aria-hidden="true">
      <img src="/art/peninsula-four-seasons-hong-kong.webp" alt="" draggable={false} />
    </div>
  </div>;
}
