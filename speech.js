// English-only speech. Never fall back silently to a non-English system voice.
export function createSpeech(onMessage=()=>{}){
 const synth=window.speechSynthesis;let run=0,pending=null,pauseTimer=null;
 let preferences={voiceURI:'',rate:.93};
 try{const saved=JSON.parse(localStorage.getItem('beach-english-voice')||'{}');preferences={...preferences,...saved};}catch{}
 if(![.85,.93,1].includes(Number(preferences.rate)))preferences.rate=.93;
 const language=v=>String(v.lang||'').replace(/_/g,'-').toLowerCase();
 function score(v){let n=0;const name=v.name||'',lang=language(v);if(lang==='en-gb')n+=35;else if(lang==='en-us')n+=15;
  if(/natural|neural|premium|enhanced/i.test(name))n+=90;
  if(/Google UK English Female|Sonia|Serena|Samantha|Moira|Karen/i.test(name))n+=55;
  if(/espeak|compact|novelty|robot|whisper|trinoids|zarvox|bells|boing|bubbles|bad news|good news/i.test(name))n-=200;
  return n;
 }
 function voices(){return synth?synth.getVoices().filter(v=>/^en(?:-|$)/.test(language(v))).sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name)):[];}
 function selected(){const list=voices();return list.find(v=>v.voiceURI===preferences.voiceURI)||list[0]||null;}
 function configure(voiceURI,rate){preferences={voiceURI:String(voiceURI||''),rate:[.85,.93,1].includes(Number(rate))?Number(rate):.93};try{localStorage.setItem('beach-english-voice',JSON.stringify(preferences));}catch{}}
 function stop(){run++;clearTimeout(pauseTimer);if(pending){pending(false);pending=null;}if(synth)synth.cancel();}
 function waitForVoice(){if(voices().length||!synth)return Promise.resolve();return new Promise(resolve=>{let timer;const finish=()=>{clearTimeout(timer);synth.removeEventListener('voiceschanged',finish);resolve();};synth.addEventListener('voiceschanged',finish);timer=setTimeout(finish,1800);});}
 async function speak(text){stop();const ticket=run;if(!synth){onMessage('This browser has no speech audio. Use a teacher video or another browser.');return false;}await waitForVoice();if(ticket!==run)return false;const voice=selected();if(!voice){onMessage('No English voice is available. Add an English voice in your device settings, then reload the game.');return false;}
  const chunks=String(text).match(/[^.!?]+[.!?]*/g)||[String(text)];
  return new Promise(resolve=>{pending=resolve;let index=0;function done(ok){if(ticket!==run)return;pending=null;resolve(ok);}function next(){if(ticket!==run)return;const u=new SpeechSynthesisUtterance(chunks[index].trim());u.voice=voice;u.lang=voice.lang.replace(/_/g,'-');u.rate=Number(preferences.rate);u.pitch=1;u.volume=1;
   u.onend=()=>{if(ticket!==run)return;index++;if(index>=chunks.length)done(true);else pauseTimer=setTimeout(next,320);};
   u.onerror=e=>{if(ticket!==run)return;if(!['interrupted','canceled'].includes(e.error))onMessage('The English audio did not play. Open English voice and test another voice.');done(false);};synth.speak(u);
  }next();});
 }
 // Start voice loading well before the learner presses Listen.
 if(synth)synth.getVoices();
 return {speak,stop,voices,selected,configure,preferences:()=>({...preferences})};
}
