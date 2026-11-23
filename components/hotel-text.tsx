import {HOTELS} from '../lib/game/engine';

const hotelNames = new Map(HOTELS.flatMap(hotel =>
  [[hotel.name, hotel.colour], [hotel.zh, hotel.colour]] as [string, string][],
));
function namePattern(names: string[]) {
  return new RegExp(
  '(' + names.sort((a,b)=>b.length-a.length)
    .map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|') + ')',
  'g',
  );
}
const hotelNamePattern = namePattern([...hotelNames.keys()]);
HOTELS.forEach(hotel => hotelNames.set(hotel.short, hotel.colour));
hotelNames.set('文華東方', HOTELS[0].colour);
hotelNames.set('Peninsula', HOTELS[1].colour);
hotelNames.set('Hoshino', HOTELS[2].colour);
const shortHotelNamePattern = namePattern([...hotelNames.keys()]);
export function hotelText(message: string, includeShortNames = false){
  return message.split(includeShortNames ? shortHotelNamePattern : hotelNamePattern).map((part,index)=>
    index%2===1?<span className="hotel-coloured-name" key={index} style={{color:hotelNames.get(part)}}>{part}</span>:part,
  );
}

