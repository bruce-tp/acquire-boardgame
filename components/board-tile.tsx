import {useLanguage} from "./language";
import {useId, type CSSProperties} from 'react';
import {Building2} from 'lucide-react';
import {HOTELS, label, type placement} from '../lib/game/engine.ts';

const eventLabels = {
  found: ['成立', 'Founding'],
  expand: ['擴展', 'Expansion'],
  merge: ['合併', 'Merger'],
} as const;

export function GuesthouseWordmark({logo, className}: {logo: string; className: string}) {
  const cropId = useId();
  return <svg className={className} viewBox="85 885 1095 245" aria-hidden="true" focusable="false">
    <defs><clipPath id={cropId}><rect x="85" y="885" width="1095" height="245"/></clipPath></defs>
    <image href={logo} width="1254" height="1254" clipPath={`url(#${cropId})`}/>
  </svg>;
}

export function boardHotelLogo(hotel: (typeof HOTELS)[number]) {
  return hotel.logo;
}

type BoardTileProps = {
  tile: number;
  value: number;
  plan: ReturnType<typeof placement> | null;
  playable: boolean;
  selected: boolean;
  latest: boolean;
  onSelect?: () => void;
};

export function BoardTile({tile, value, plan, playable, selected, latest, onSelect}: BoardTileProps) {
  const {t, localiseMessage} = useLanguage();

  const hotel = HOTELS[value];
  const independent = value === 7;
  const coordinate = label(tile);
  const event = playable && plan
    ? plan.chains.length > 1 ? 'merge' : plan.chains.length === 1 ? 'expand' : plan.group.length > 1 ? 'found' : null
    : null;
  const eventLabel = event ? t(eventLabels[event][0], eventLabels[event][1]) : '';
  const placementStatus = selected ? t('已選取', 'Selected') : t('可放置', 'Place here');
  const description = hotel ? t(hotel.zh, hotel.name) : independent ? t("獨立建築", "Independent building") : plan ? t("你的專屬地塊", "Your private building spot") : t("空地", "Empty lot");
  const classes = [
    'tile', hotel ? 'hotel-tile' : independent ? 'independent' : '',
    hotel?.mark === 'RGH' && 'guesthouse-tile', plan && 'held', playable && 'playable', selected && 'selected', latest && 'last', event && 'tile-event tile-event-' + event,
  ].filter(Boolean).join(' ');
  const maskImage = hotel ? 'url("' + boardHotelLogo(hotel) + '")' : undefined;

  return <button type="button" className={classes}
    title={coordinate + ' · ' + (plan?.reason ? localiseMessage(plan.reason) : description)}
    aria-label={[coordinate, description, playable && placementStatus, eventLabel, latest && t("最近放置", "Latest placement")].filter(Boolean).join(' · ')}
    aria-pressed={playable ? selected : undefined}
    disabled={!playable || !onSelect} onClick={onSelect}
    style={hotel ? {'--hotel': hotel.colour} as CSSProperties : undefined}>
    {event && <span className="tile-event-badge" title={eventLabel} aria-hidden="true">{eventLabel}</span>}
    {hotel ? <>
      {hotel.mark === 'RGH'
        ? <GuesthouseWordmark logo={hotel.logo} className="board-guesthouse-wordmark"/>
        : <span className="board-hotel-logo" aria-hidden="true" style={{maskImage, WebkitMaskImage: maskImage}}/>}
      <span className="tile-coordinate">{coordinate}</span>
    </> : independent ? <>
      <Building2 size={20} aria-hidden="true"/>
      <span className="tile-coordinate">{coordinate}</span>
      <span className="independent-tile-label" aria-hidden="true">{t("獨立建築", "Independent")}</span>
    </> : plan ? <span>{coordinate}</span> : <span className="tile-dot" aria-hidden="true">·</span>}
    {playable && (!event || selected) && <span className="tile-placement-label" aria-hidden="true">
      {placementStatus}
    </span>}
    {latest && <span className="latest-tile-badge" aria-hidden="true">{t("最新", "Latest")}</span>}
  </button>;
}
