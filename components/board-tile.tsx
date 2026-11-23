import type {CSSProperties} from 'react';
import {Building2} from 'lucide-react';
import {HOTELS, label, type placement} from '../lib/game/engine.ts';

const eventLabels = {
  found: ['成立', 'Founding'],
  expand: ['擴展', 'Expansion'],
  merge: ['合併', 'Merger'],
} as const;

const compactHotelNames: Record<string, readonly [string, string]> = {
  P: ['The', 'Peninsula'],
  HR: ['星野', 'リゾート'],
  IH: ['Imperial', 'Hotel'],
};

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
  const hotel = HOTELS[value];
  const compactName = hotel && compactHotelNames[hotel.mark];
  const independent = value === 7;
  const coordinate = label(tile);
  const event = playable && plan
    ? plan.chains.length > 1 ? 'merge' : plan.chains.length === 1 ? 'expand' : plan.group.length > 1 ? 'found' : null
    : null;
  const eventLabel = event ? eventLabels[event].join(' · ') : '';
  const placementStatus = selected ? ['已選取', 'Selected'] : ['可放置', 'Place here'];
  const description = hotel ? hotel.name : independent ? '獨立建築 · Independent building' : plan ? '你的專屬地塊 · Your private building spot' : '空地 · Empty lot';
  const classes = [
    'tile', hotel ? 'hotel-tile' : independent ? 'independent' : '',
    compactName && 'hotel-tile-wordmark',
    plan && 'held', playable && 'playable', selected && 'selected', latest && 'last', event && 'tile-event tile-event-' + event,
  ].filter(Boolean).join(' ');
  const maskImage = hotel ? 'url("' + hotel.logo + '")' : undefined;

  return <button type="button" className={classes}
    title={coordinate + ' · ' + (plan?.reason || description)}
    aria-label={[coordinate, description, playable && placementStatus.join(' · '), eventLabel, latest && '最新落牌 · Latest placement'].filter(Boolean).join(' · ')}
    aria-pressed={playable ? selected : undefined}
    disabled={!playable || !onSelect} onClick={onSelect}
    style={hotel ? {'--hotel': hotel.colour} as CSSProperties : undefined}>
    {event && <span className="tile-event-badge" title={eventLabel} aria-hidden="true">{eventLabels[event][0]}<small lang="en">{eventLabels[event][1]}</small></span>}
    {hotel ? <>
      {compactName
        ? <span className="board-hotel-wordmark" lang={hotel.mark === 'HR' ? 'ja' : 'en'} aria-hidden="true">{compactName.map(line => <span key={line}>{line}</span>)}</span>
        : <span className="board-hotel-logo" aria-hidden="true" style={{maskImage, WebkitMaskImage: maskImage}}/>}
      <span className="tile-coordinate">{coordinate}</span>
    </> : independent ? <>
      <Building2 size={20} aria-hidden="true"/>
      <span className="tile-coordinate">{coordinate}</span>
      <span className="independent-tile-label" aria-hidden="true">獨立建築<small lang="en">Independent</small></span>
    </> : plan ? <span>{coordinate}</span> : <span className="tile-dot" aria-hidden="true">·</span>}
    {playable && (!event || selected) && <span className="tile-placement-label" aria-hidden="true">
      {placementStatus[0]}<small lang="en">{placementStatus[1]}</small>
    </span>}
    {latest && <span className="latest-tile-badge" lang="en" aria-hidden="true">Latest</span>}
  </button>;
}
