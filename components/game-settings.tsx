'use client';
import {gameSettings,type GameSettings} from '../lib/game/settings';
const cash=(n:number)=>'$'+n.toLocaleString('en-GB');
export function GameSettingsPicker({value,onChange,disabled=false}:{value:GameSettings;onChange:(s:GameSettings)=>void;disabled?:boolean}){
  return <div className="game-settings-picker">
    <fieldset disabled={disabled}><legend>1 · 規則版本 <small>Rule edition</small></legend>
      <label className="setting-choice selected"><input type="radio" name="edition" value="classic" checked readOnly/><span><strong>經典版 · Classic</strong><small>放地塊、買股票、合併酒店 · Build, invest and merge</small></span></label>
    </fieldset>
    <fieldset disabled={disabled}><legend>2 · 股東獎金 <small>Shareholder bonuses</small></legend><div className="bonus-options">
      <label className={'setting-choice '+(value.bonusMode==='standard'?'selected':'')}><input type="radio" name="bonus-mode" checked={value.bonusMode==='standard'} onChange={()=>onChange({...value,bonusMode:'standard',majorityMultiplier:10})}/><span><strong>標準 · Standard</strong><small>大股東 10× · 二股東 5×</small></span></label>
      <label className={'setting-choice '+(value.bonusMode==='custom'?'selected':'')}><input type="radio" name="bonus-mode" checked={value.bonusMode==='custom'} onChange={()=>onChange({...value,bonusMode:'custom',majorityMultiplier:7})}/><span><strong>自訂 · Custom</strong><small>自行選擇獎金倍數 · Choose multipliers</small></span></label>
    </div>{value.bonusMode==='custom'&&<div className="custom-bonus-panel"><label htmlFor="majority-multiplier">大股東獎金倍數 <small>Majority multiplier</small></label><select id="majority-multiplier" value={value.majorityMultiplier} onChange={e=>onChange({...value,majorityMultiplier:Number(e.target.value) as GameSettings['majorityMultiplier']})}>{[5,7,10].map(n=><option key={n} value={n}>{n}×</option>)}</select><p>二股東自動設為 {value.majorityMultiplier/2}× · Minority automatically receives {value.majorityMultiplier/2}×.</p><p>股價 $500 時：大股東 {cash(500*value.majorityMultiplier)}；二股東 {cash(250*value.majorityMultiplier)}。<br/>At $500 per share: majority {cash(500*value.majorityMultiplier)}; minority {cash(250*value.majorityMultiplier)}.</p><small>正常獎金按倍數計算；並列分獎時才向上取整至 $100。<br/>Exact multipliers apply; only split awards are rounded up to $100.</small></div>}</fieldset>
  </div>;
}
export function GameSettingsSummary({settings,compact=false}:{settings?:GameSettings;compact?:boolean}){
 const s=gameSettings(settings);
 return <div className={'game-settings-summary '+(compact?'compact':'')} aria-label="房間規則及獎金 · Room rules and bonuses"><strong>Classic · {s.bonusMode==='standard'?'標準 Standard':'自訂 Custom'}</strong><span>大股東 {s.majorityMultiplier}× ／ 二股東 {s.majorityMultiplier/2}× <small>Majority / Minority</small></span></div>;
}
