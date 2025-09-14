const modal=document.getElementById("climaModal");
document.getElementById("openMonitor").onclick=()=>modal.style.display="flex";
document.getElementById("closeModal").onclick=()=>modal.style.display="none";

const cityInput=document.getElementById('cityInput');
const intervalEl=document.getElementById('interval');
const startBtn=document.getElementById('startBtn');
const stopBtn=document.getElementById('stopBtn');
const tempEl=document.getElementById('temp');
const condEl=document.getElementById('cond');
const humEl=document.getElementById('hum');
const updatedEl=document.getElementById('updated');
const iconEl=document.getElementById('icon');
const cityNameEl=document.getElementById('cityName');
const toast=document.getElementById('toast');
const toastTitle=document.getElementById('toastTitle');
const toastBody=document.getElementById('toastBody');
const novedadesList=document.getElementById('novedadesList');

let timer=null;
let lastState=null;

const conds=["Soleado","Nublado","Lluvioso"];
function showToast(title,msg){
  toastTitle.textContent=title;
  toastBody.textContent=msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),4000);
}
function getEmoji(cond){
  if(cond.includes("Soleado")) return "☀️";
  if(cond.includes("Nublado")) return "☁️";
  if(cond.includes("Lluvia")) return "🌧️";
  return "🌤️";
}
function simulate(city){
  const prev=lastState;
  const baseT=prev?Number(prev.temp):20+Math.random()*6;
  const temp=baseT+(Math.random()*4-2);
  const cond=prev&&Math.random()<0.7?prev.cond:conds[Math.floor(Math.random()*conds.length)];
  return {city,temp:temp.toFixed(1),cond,hum:Math.floor(40+Math.random()*60),ts:Date.now()};
}
function detectNovelty(prev,next){
  if(!prev) return true;
  return Math.abs(next.temp-prev.temp)>=2 || next.cond!==prev.cond;
}
function updateUI(state,isNovel){
  tempEl.textContent=`${state.temp} °C`;
  condEl.textContent=`Condición: ${state.cond}`;
  humEl.textContent=`Humedad: ${state.hum}%`;
  updatedEl.textContent=`Actualizado: ${new Date(state.ts).toLocaleTimeString()}`;
  iconEl.textContent=getEmoji(state.cond);
  cityNameEl.textContent=`Ciudad: ${state.city}`;
  if(isNovel){
    const item=document.createElement("li");
    let cambio=lastState?` (antes: ${lastState.cond}, ${lastState.temp}°C)`:"";
    item.textContent=`${new Date(state.ts).toLocaleTimeString()} — ${state.city}: ${state.temp}°C — ${state.cond}${cambio}`;
    novedadesList.prepend(item);
    showToast("Cambio detectado",`${state.city} ahora ${state.temp}°C y ${state.cond}${cambio}`);
  }
}
function checkOnce(){
  const city=cityInput.value.trim();
  const state=simulate(city);
  const isNovel=detectNovelty(lastState,state);
  updateUI(state,isNovel);
  lastState=state;
}

startBtn.onclick=()=>{
  const city=cityInput.value.trim();
  if(city===""){
    showToast("Error","Debes ingresar el nombre de la ciudad antes de iniciar");
    cityInput.focus();
    return;
  }
  checkOnce();
  timer=setInterval(checkOnce,(Number(intervalEl.value)||5)*1000);
  startBtn.disabled=true;
  stopBtn.disabled=false;
}
stopBtn.onclick=()=>{clearInterval(timer);startBtn.disabled=false;stopBtn.disabled=true;}