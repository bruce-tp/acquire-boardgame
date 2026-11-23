'use client';

import {useEffect, useState} from 'react';

export function HotelPoster({ landing = false, hidden = false, id }: {
  landing?: boolean;
  hidden?: boolean;
  id?: string;
}) {
  const [useHoshinoya, setUseHoshinoya] = useState(false);
  const [hoshinoyaReady, setHoshinoyaReady] = useState(false);

  useEffect(() => {
    setUseHoshinoya(landing && new URLSearchParams(window.location.search).get('cover') !== 'original');
  }, [landing]);

  const showHoshinoya = useHoshinoya && hoshinoyaReady;
  return <div id={id} className={'city-panorama branded-hotel-panorama' + (landing ? ' landing-hotel-poster' : '')}
    role="img" aria-label={showHoshinoya
      ? '香港半島酒店與星のや東京 · The Peninsula Hong Kong and HOSHINOYA Tokyo'
      : '香港半島酒店與星野リゾート · The Peninsula Hong Kong and Hoshino Resorts'} hidden={hidden}>
    <div className="hotel-poster-stage" aria-hidden="true">
      <img src={landing ? '/art/hotel-dusk-oil.webp' : '/art/peninsula-okura-night-v3.png'} alt="" draggable={false} />
      {useHoshinoya && <img className="hoshinoya-cover-layer" src="/art/hotel-dusk-hoshinoya-preview.webp"
        alt="" draggable={false} onLoad={() => setHoshinoyaReady(true)} onError={() => setHoshinoyaReady(false)} />}
      <span className="hotel-poster-sign peninsula-sign">THE PENINSULA</span>
      <span className={'hotel-poster-sign hoshino-sign' + (showHoshinoya ? ' hoshinoya-cover-sign' : '')} lang="ja">
        {showHoshinoya ? <>
          <span className="hoshinoya-sign-crests">
            <span className="hoshinoya-flower">✿</span>
            <span className="hoshinoya-name-seal">星のや</span>
            <span className="hoshinoya-moon"/>
          </span>
          <span className="hoshinoya-sign-wordmark">星のや東京<small lang="en">HOSHINOYA Tokyo</small></span>
        </> : '星野リゾート'}
      </span>
    </div>
  </div>;
}
