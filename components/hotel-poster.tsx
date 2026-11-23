'use client';

import {useEffect, useState} from 'react';

export function HotelPoster({ landing = false, hidden = false, id }: {
  landing?: boolean;
  hidden?: boolean;
  id?: string;
}) {
  const [preview, setPreview] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);

  useEffect(() => {
    setPreview(landing && new URLSearchParams(window.location.search).get('cover') === 'hoshinoya');
  }, [landing]);

  const showHoshinoya = preview && previewReady;
  return <div id={id} className={'city-panorama branded-hotel-panorama' + (landing ? ' landing-hotel-poster' : '')}
    role="img" aria-label={showHoshinoya
      ? '香港半島酒店與星のや東京 · The Peninsula Hong Kong and HOSHINOYA Tokyo'
      : '香港半島酒店與星野リゾート · The Peninsula Hong Kong and Hoshino Resorts'} hidden={hidden}>
    <div className="hotel-poster-stage" aria-hidden="true">
      <img src={landing ? '/art/hotel-dusk-oil.webp' : '/art/peninsula-okura-night-v3.png'} alt="" draggable={false} />
      {preview && <img className="hoshinoya-cover-layer" src="/art/hotel-dusk-hoshinoya-preview.webp"
        alt="" draggable={false} onLoad={() => setPreviewReady(true)} onError={() => setPreviewReady(false)} />}
      <span className="hotel-poster-sign peninsula-sign">THE PENINSULA</span>
      <span className={'hotel-poster-sign hoshino-sign' + (showHoshinoya ? ' hoshinoya-preview-sign' : '')} lang="ja">
        {showHoshinoya ? '星のや東京' : '星野リゾート'}
      </span>
    </div>
  </div>;
}
