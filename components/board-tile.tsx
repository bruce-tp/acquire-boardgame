import type {CSSProperties} from 'react';
import {Building2} from 'lucide-react';
import {HOTELS, label, type placement} from '../lib/game/engine.ts';

type BoardTileProps = {
  tile: number;
  value: number;
  plan: ReturnType<typeof placement> | null;
  playable: boolean;
  selected: boolean;
  latest: boolean;
  onSelect: () => void;
};

export function BoardTile({tile, value, plan, playable, selected, latest, onSelect}: BoardTileProps) {
  const hotel = HOTELS[value];
  const independent = value === 7;
  const coordinate = label(tile);
  const event = playable && plan
    ? plan.chains.length > 1 ? 'merge' : plan.chains.length === 0 && plan.group.length > 1 ? 'found' : null
    : null;
  const eventLabel = event === 'merge' ? '合併 · Merger' : event === 'found' ? '成立酒店 · Founding' : '';
  const placementStatus = selected ? '已選取 · Selected' : '可放置 · Place here';
  const description = hotel ? hotel.name : independent ? '獨立建築 · Independent building' : plan ? '你的地塊 · Your tile' : '空地 · Empty lot';
  const classes = [
    'tile', hotel ? 'hotel-tile' : independent ? 'independent' : '',
    plan && 'held', playable && 'playable', selected && 'selected', latest && 'last', event && 'tile-event tile-event-' + event,
  ].filter(Boolean).join(' ');
  const maskImage = hotel ? 'url("' + hotel.logo + '")' : undefined;

  return <button type="button" className={classes}
    title={coordinate + ' · ' + (plan?.reason || description)}
    aria-label={[coordinate, description, playable && placementStatus, eventLabel, latest && '最新落牌 · Latest placement'].filter(Boolean).join(' · ')}
    aria-pressed={playable ? selected : undefined}
    disabled={!playable} onClick={onSelect}
    style={hotel ? {'--hotel': hotel.colour} as CSSProperties : undefined}>
    {event && <span className="tile-event-badge" title={eventLabel} aria-hidden="true">{event === 'merge' ? '合併' : '成立'}</span>}
    {hotel ? <>
      <span className="board-hotel-logo" aria-hidden="true" style={{maskImage, WebkitMaskImage: maskImage}}/>
      <span className="tile-coordinate">{coordinate}</span>
    </> : independent ? <>
      <Building2 size={20} aria-hidden="true"/>
      <span className="tile-coordinate">{coordinate}</span>
      <span className="independent-tile-label" aria-hidden="true">獨立建築</span>
    </> : plan ? <span>{coordinate}</span> : <span className="tile-dot" aria-hidden="true">·</span>}
    {playable && (!event || selected) && <span className="tile-placement-label" aria-hidden="true">
      {selected ? '已選取' : '可放置'}
    </span>}
    {latest && <span className="latest-tile-badge" aria-hidden="true">最新</span>}
  </button>;
}
