'use client';
import {Volume2,VolumeX,Play} from 'lucide-react';
import {useRef,useEffect} from 'react';

export function SoundControls({sound,volume,error,toggle,setVolume,preview}:{
  sound:boolean;volume:number;error:string;toggle:()=>void;setVolume:(n:number)=>void;preview:()=>void;
}) {
  const panel=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{
    const dismiss=(event:PointerEvent)=>{if(panel.current&&!panel.current.contains(event.target as Node))panel.current.open=false;};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&panel.current)panel.current.open=false;};
    document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape);};
  },[]);
  return <details className="sound-controls" ref={panel}>
    <summary title="提示音設定 · Alert sound settings" aria-label="提示音設定 · Alert sound settings">
      {sound?<Volume2 size={19}/>:<VolumeX size={19}/>}<span>音效</span>
    </summary>
    <div className="sound-popover">
      <div className="sound-popover-title"><strong>回合提示音 <small>Turn alerts</small></strong><button type="button" className="sound-mute" onClick={toggle} aria-pressed={sound}>{sound?'靜音 · Mute':'開啟 · Unmute'}</button></div>
      <label htmlFor="turn-alert-volume">提示音量 · Volume <strong>{volume}%</strong></label>
      <input id="turn-alert-volume" type="range" min="10" max="100" step="5" value={volume} onChange={event=>setVolume(Number(event.target.value))}/>
      <button type="button" className="primary sound-preview" onClick={preview}><Play size={16}/>試聽提示音 · Preview alert</button>
      <p>較清楚嘅雙聲提示，音量會自動記住。<br/>A sustained double bell. Your volume setting is saved.</p>
      {error&&<p className="sound-error" role="alert">{error}</p>}
    </div>
  </details>;
}
