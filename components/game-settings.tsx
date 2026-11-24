'use client';
import {useLanguage} from "./language";
import {gameSettings,type GameSettings} from '../lib/game/settings';
const cash=(n:number)=>'$'+n.toLocaleString('en-GB');
export function GameSettingsPicker({value,onChange,disabled=false}:{value:GameSettings;onChange:(s:GameSettings)=>void;disabled?:boolean}){
  const {t} = useLanguage();

  return <div className="game-settings-picker">
    <fieldset disabled={disabled}><legend>{t("1 · 規則版本", "Rule edition")}</legend>
      <label className="setting-choice selected"><input type="radio" name="edition" value="classic" checked readOnly/><span><strong>{t("經典版", "Classic")}</strong><small>{t("放地塊、買股票、合併酒店", "Build, invest and merge")}</small></span></label>
    </fieldset>
    <fieldset disabled={disabled}><legend>{t("2 · 股東獎金", "Shareholder bonuses")}</legend><div className="bonus-options">
      <label className={'setting-choice '+(value.bonusMode==='standard'?'selected':'')}><input type="radio" name="bonus-mode" checked={value.bonusMode==='standard'} onChange={()=>onChange({...value,bonusMode:'standard',majorityMultiplier:10})}/><span><strong>{t("標準", "Standard")}</strong><small>{t("大股東 10× · 二股東 5×", "Majority 10× · Minority 5×")}</small></span></label>
      <label className={'setting-choice '+(value.bonusMode==='custom'?'selected':'')}><input type="radio" name="bonus-mode" checked={value.bonusMode==='custom'} onChange={()=>onChange({...value,bonusMode:'custom',majorityMultiplier:7})}/><span><strong>{t("自訂", "Custom")}</strong><small>{t("自行選擇獎金倍數", "Choose multipliers")}</small></span></label>
    </div>{value.bonusMode==='custom'&&<div className="custom-bonus-panel"><label htmlFor="majority-multiplier">{t("大股東獎金倍數", "Majority multiplier")}</label><select id="majority-multiplier" value={value.majorityMultiplier} onChange={e=>onChange({...value,majorityMultiplier:Number(e.target.value) as GameSettings['majorityMultiplier']})}>{[5,7,10].map(n=><option key={n} value={n}>{n}×</option>)}</select><p>{t(`二股東自動設為 ${value.majorityMultiplier/2}×。`, `Minority automatically receives ${value.majorityMultiplier/2}×.`)}</p><p>{t(`股價 $500 時：大股東 ${cash(500*value.majorityMultiplier)}；二股東 ${cash(250*value.majorityMultiplier)}。`, `At $500 per share: majority ${cash(500*value.majorityMultiplier)}, minority ${cash(250*value.majorityMultiplier)}.`)}</p><small>{t("正常獎金按倍數計算；並列分獎時才向上取整至 $100。", "Exact multipliers apply; only split awards are rounded up to $100.")}</small></div>}</fieldset>
  </div>;
}
export function GameSettingsSummary({settings,compact=false}:{settings?:GameSettings;compact?:boolean}){
  const {t} = useLanguage();

 const s=gameSettings(settings);
 return <div className={'game-settings-summary '+(compact?'compact':'')} aria-label={t("房間規則及獎金", "Room rules and bonuses")}><strong>{t("經典版", "Classic")} · {s.bonusMode==='standard'?t("標準", "Standard"):t("自訂", "Custom")}</strong><span>{t("大股東", "Majority")} {s.majorityMultiplier}× / {t("二股東", "Minority")} {s.majorityMultiplier/2}×</span></div>;
}
