/* TapPayment — lógica compartida. Los datos vienen de window.CONFIG en cada página. */
const CONFIG = window.CONFIG;

const BANKS = {"002":"Banamex","012":"BBVA","014":"Santander","021":"HSBC","030":"BanBajío","036":"Inbursa","042":"Mifel","044":"Scotiabank","058":"Banregio","059":"Invex","062":"Afirme","072":"Banorte","106":"Bank of America","127":"Banco Azteca","130":"Compartamos","137":"BanCoppel","145":"Banco Base","166":"Banco del Bienestar","167":"Hey Banco","646":"STP","638":"Nu México","722":"Mercado Pago","728":"Spin by OXXO"};

const $ = id => document.getElementById(id);
const digits = s => String(s||"").replace(/\D/g,"");
function phone10(n){ n = digits(n).slice(-10); return n.slice(0,3)+" "+n.slice(3,6)+" "+n.slice(6); }
function clabeValid(c){
  if(!/^\d{18}$/.test(c)) return false;
  const w=[3,7,1]; let s=0;
  for(let i=0;i<17;i++) s += (+c[i]*w[i%3])%10;
  return (10 - s%10)%10 === +c[17];
}
function luhn(n){
  if(!/^\d{15,16}$/.test(n)) return false;
  let s=0, alt=false;
  for(let i=n.length-1;i>=0;i--){ let d=+n[i]; if(alt){ d*=2; if(d>9) d-=9; } s+=d; alt=!alt; }
  return s%10===0;
}
function renderGroups(el, groups, chkLast){
  el.innerHTML = "";
  groups.forEach((g,i)=>{ const s=document.createElement("span"); s.textContent=g; if(chkLast && i===groups.length-1) s.className="chk"; el.appendChild(s); });
  el.setAttribute("aria-label", groups.join(""));
}

/* Pintar datos */
const CLABE = digits(CONFIG.clabe);
const CLABE_GROUPS = [CLABE.slice(0,3), CLABE.slice(3,6), CLABE.slice(6,10), CLABE.slice(10,14), CLABE.slice(14)];
const CARD = digits(CONFIG.card);
const CARD_GROUPS = CARD.match(/.{1,4}/g) || [];
const bankName = BANKS[CLABE.slice(0,3)] || "Otro banco";

document.title = CONFIG.business;
$("bizName").textContent = CONFIG.business;
$("tagline").textContent = CONFIG.tagline;
$("initial").textContent = CONFIG.business.trim().charAt(0).toUpperCase();
$("holder").textContent = CONFIG.holder;
$("holderTrust").textContent = CONFIG.holder;
$("concept").textContent = CONFIG.concept;
$("bank").textContent = bankName;
renderGroups($("clabe"), CLABE_GROUPS, true);

const ok = clabeValid(CLABE);
$("clabeCheck").textContent = ok ? "✓ CLABE válida · " + bankName : "Revisa la CLABE: el dígito final no coincide";
if(!ok) $("clabeCheck").classList.add("bad");

if(digits(CONFIG.dimo).length >= 10){ $("dimoNum").textContent = phone10(CONFIG.dimo); }
else { $("dimoCard").hidden = true; }

if(CARD.length >= 15){
  $("cardCard").hidden = false;
  renderGroups($("cardNum"), CARD_GROUPS, false);
  const cok = luhn(CARD);
  $("cardCheck").textContent = cok ? "✓ Número de tarjeta válido" : "Revisa el número de tarjeta";
  if(!cok) $("cardCheck").classList.add("bad");
}

const WA = digits(CONFIG.whatsapp);
$("waNum").textContent = phone10(WA);

/* WhatsApp con mensaje listo */
function money(v){
  const n = parseFloat(String(v).replace(/[^\d.]/g,""));
  return isFinite(n) && n>0 ? n.toLocaleString("es-MX",{minimumFractionDigits:2, maximumFractionDigits:2}) : "";
}
function updateWa(){
  const m = money($("amount").value);
  const msg = "Hola " + CONFIG.business + ", ya te hice la transferencia" + (m ? " de $" + m : "") + ". Te mando el comprobante.";
  $("waBtn").href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg);
}
$("amount").addEventListener("input", updateWa);
updateWa();

/* Copiar */
const toast = $("toast"); let t;
function say(msg){ toast.textContent = msg; toast.hidden = false; clearTimeout(t); t = setTimeout(()=> toast.hidden = true, 2400); }
function selectText(el){ const r=document.createRange(); r.selectNodeContents(el); const s=getSelection(); s.removeAllRanges(); s.addRange(r); }
async function copy(text, el, btn, okLabel){
  const base = btn.dataset.base || (btn.dataset.base = btn.textContent);
  try{
    await navigator.clipboard.writeText(text);
    btn.textContent = okLabel; btn.classList.add("done");
    setTimeout(()=>{ btn.textContent = base; btn.classList.remove("done"); }, 2500);
    say(okLabel + ". Pégalo en tu banco.");
  }catch(e){
    selectText(el);
    say("Texto seleccionado. Mantén presionado y elige Copiar.");
  }
}
$("copyClabe").addEventListener("click", e => copy(CLABE, $("clabe"), e.currentTarget, "CLABE copiada"));
$("copyDimo").addEventListener("click", e => copy(digits(CONFIG.dimo).slice(-10), $("dimoNum"), e.currentTarget, "Número copiado"));
$("copyCard").addEventListener("click", e => copy(CARD, $("cardNum"), e.currentTarget, "Tarjeta copiada"));
document.querySelectorAll("[data-copy]").forEach(b => b.addEventListener("click", () => {
  const el = $(b.dataset.copy);
  copy(b.dataset.copy==="waNum" ? WA.slice(-10) : el.textContent.trim(), el, b, b.dataset.ok);
}));

/* Escribir por bloques (CLABE o tarjeta) */
const typer = $("typer"), blocksEl = $("blocks");
let groups = [], done = [], key = "", opener = null;
function load(k, n){ try{ const v = JSON.parse(sessionStorage.getItem(k)); if(Array.isArray(v) && v.length===n) return v; }catch(e){} return Array(n).fill(false); }
function save(){ try{ sessionStorage.setItem(key, JSON.stringify(done)); }catch(e){} }
function paint(){
  blocksEl.innerHTML = "";
  const next = done.indexOf(false);
  groups.forEach((g,i)=>{
    const b = document.createElement("button");
    b.type = "button";
    b.className = "block" + (done[i] ? " done" : "") + (i===next ? " next" : "");
    b.innerHTML = '<span class="n">Bloque '+(i+1)+'</span><span class="d"></span><span class="st">'+(done[i] ? "✓ Listo" : (i===next ? "Escribe este" : ""))+'</span>';
    b.querySelector(".d").textContent = g;
    b.setAttribute("aria-pressed", done[i] ? "true" : "false");
    b.addEventListener("click", ()=>{ done[i] = !done[i]; save(); paint(); });
    blocksEl.appendChild(b);
  });
  const c = done.filter(Boolean).length;
  $("barFill").style.width = (c/groups.length*100) + "%";
  $("progress").textContent = c===groups.length ? "Listo. Revisa que el banco muestre a nombre de " + CONFIG.holder + "." : c + " de " + groups.length + " bloques escritos";
}
function openTyper(title, g, k, btn){
  groups = g; key = k; done = load(k, g.length); opener = btn;
  $("typerTitle").textContent = title;
  typer.hidden = false; document.body.style.overflow = "hidden";
  paint(); $("closeTyper").focus();
}
function closeTyper(){ typer.hidden = true; document.body.style.overflow = ""; if(opener) opener.focus(); }
$("openClabeTyper").addEventListener("click", e => openTyper("Escribe la CLABE por bloques", CLABE_GROUPS, "tp-clabe", e.currentTarget));
$("openCardTyper").addEventListener("click", e => openTyper("Escribe la tarjeta por bloques", CARD_GROUPS, "tp-card", e.currentTarget));
$("resetBlocks").addEventListener("click", ()=>{ done = done.map(()=>false); save(); paint(); });
$("closeTyper").addEventListener("click", closeTyper);
document.addEventListener("keydown", e => { if(e.key==="Escape" && !typer.hidden) closeTyper(); });
