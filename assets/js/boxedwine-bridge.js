(function(){
  "use strict";

  const DB_NAME="juegosretro-assets";
  const DB_VERSION=1;
  const STORE="files";
  const GAME_KEY="ignition.zip";
  const originalFetch=window.fetch.bind(window);

  function openDb(){
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB_NAME,DB_VERSION);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
    });
  }

  async function getGame(){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,"readonly");
      const req=tx.objectStore(STORE).get(GAME_KEY);
      req.onsuccess=()=>resolve(req.result || null);
      req.onerror=()=>reject(req.error);
    });
  }

  window.fetch=async function(input,init){
    let raw="";
    try{
      raw=typeof input==="string" ? input : (input && input.url ? input.url : String(input));
      const url=new URL(raw,location.href);
      const filename=url.pathname.split("/").pop().toLowerCase();

      if(filename==="ignition.zip"){
        const record=await getGame();
        if(record && record.blob instanceof Blob){
          console.log("[JUEGOS RETRO] Sirviendo ignition.zip desde IndexedDB local");
          return new Response(record.blob,{
            status:200,
            statusText:"OK",
            headers:{
              "Content-Type":"application/zip",
              "Content-Length":String(record.blob.size),
              "Cache-Control":"no-store"
            }
          });
        }
        console.error("[JUEGOS RETRO] ignition.zip no está guardado localmente");
        return new Response("Ignition local asset missing",{status:404});
      }
    }catch(error){
      console.warn("[JUEGOS RETRO] Bridge fetch fallback:",error);
    }
    return originalFetch(input,init);
  };

  function enhanceBoxedWineControls(){
    const pointerLock=document.getElementById("pointerLock");
    const showConsole=document.getElementById("showConsole");
    const resize=document.getElementById("resize");
    const canvas=document.getElementById("canvas");

    if(!pointerLock || !showConsole || !resize || !canvas) return;

    const nativeRow=pointerLock.parentElement;
    if(!nativeRow || document.getElementById("jr-runtime-controls")) return;

    pointerLock.checked=false;
    showConsole.checked=false;
    resize.checked=true;

    const output=document.getElementById("output");
    if(output) output.style.display="none";

    nativeRow.style.display="none";

    canvas.tabIndex=0;

    function focusGameInput(){
      try{
        if(document.activeElement && document.activeElement !== canvas && document.activeElement.blur){
          document.activeElement.blur();
        }
        window.focus();
        canvas.focus({preventScroll:true});
      }catch(_){
        try{ canvas.focus(); }catch(__){}
      }

      const state=document.getElementById("jr-keyboard-state");
      if(state){
        state.textContent="TECLADO ACTIVO";
        state.classList.add("active");
      }
    }

    canvas.addEventListener("mousedown",focusGameInput,true);
    canvas.addEventListener("click",focusGameInput,true);
    canvas.addEventListener("touchstart",focusGameInput,{capture:true,passive:true});

    const bar=document.createElement("div");
    bar.id="jr-runtime-controls";
    bar.innerHTML = `
      <div class="jr-runtime-left">
        <span class="jr-runtime-badge">IGNITION</span>
        <span class="jr-runtime-note">BoxedWine · cnc-ddraw</span>
        <span id="jr-keyboard-state" class="jr-keyboard-state">CLICK EN ACTIVAR TECLADO</span>
      </div>
      <div class="jr-runtime-options">
        <button id="jr-focus" class="jr-focus" type="button">ACTIVAR TECLADO</button>
        <button id="jr-fullscreen" type="button">Pantalla completa</button>
        <button id="jr-console-btn" type="button">Consola</button>
      </div>
    `;

    nativeRow.insertAdjacentElement("afterend",bar);

    const focusBtn=bar.querySelector("#jr-focus");
    const fullscreenBtn=bar.querySelector("#jr-fullscreen");
    const consoleBtn=bar.querySelector("#jr-console-btn");

    focusBtn.addEventListener("click",()=>{
      focusGameInput();
    });

    fullscreenBtn.addEventListener("click",()=>{
      if(window.Module && typeof window.Module.requestFullscreen==="function"){
        window.Module.requestFullscreen(false,true);
        setTimeout(focusGameInput,350);
      }
    });

    consoleBtn.addEventListener("click",()=>{
      showConsole.checked=!showConsole.checked;
      if(typeof window.toggleConsole==="function") window.toggleConsole();
      else if(output) output.style.display=showConsole.checked ? "block" : "none";
      consoleBtn.textContent=showConsole.checked ? "Ocultar consola" : "Consola";
      setTimeout(focusGameInput,50);
    });

    window.addEventListener("keydown",(event)=>{
      const state=document.getElementById("jr-keyboard-state");
      if(state && /^(Arrow|Shift|Escape|Enter|Space|Key|Slash|Period|Quote)/.test(event.code||"")){
        state.textContent=`TECLA: ${event.code}`;
        state.classList.add("active");
      }
    },true);

    setTimeout(focusGameInput,1200);
    setTimeout(focusGameInput,3000);

    const style=document.createElement("style");
    style.textContent=`
      body{margin:0;background:#02040a;color:#dce7ff;font-family:Arial,sans-serif}
      #jr-runtime-controls{
        min-height:56px;display:flex;align-items:center;justify-content:space-between;
        gap:18px;padding:8px 14px;background:linear-gradient(90deg,#07101d,#0b1027);
        border-bottom:1px solid rgba(90,226,255,.18);box-sizing:border-box
      }
      .jr-runtime-left{display:flex;align-items:center;gap:10px;min-width:0;flex-wrap:wrap}
      .jr-runtime-badge{font-weight:800;font-size:11px;letter-spacing:.12em;color:#2df7ff}
      .jr-runtime-note{font-size:11px;color:#7385ad}
      .jr-keyboard-state{font-size:10px;font-weight:800;letter-spacing:.08em;color:#ffcf66;
        border:1px solid rgba(255,207,102,.25);border-radius:99px;padding:5px 8px}
      .jr-keyboard-state.active{color:#63ffb0;border-color:rgba(99,255,176,.28)}
      .jr-runtime-options{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}
      #jr-runtime-controls button{border:1px solid rgba(45,247,255,.28);background:rgba(45,247,255,.08);
        color:#eafcff;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer}
      #jr-runtime-controls button:hover{background:rgba(45,247,255,.14)}
      #jr-runtime-controls .jr-focus{background:linear-gradient(90deg,#2df7ff,#79f7ff);color:#051018;border:0}
      #dropzone{background:#000}
      canvas#canvas:focus{outline:2px solid rgba(45,247,255,.55);outline-offset:2px}
      @media(max-width:720px){
        #jr-runtime-controls{align-items:flex-start;flex-direction:column}
        .jr-runtime-options{justify-content:flex-start}
      }
    `;
    document.head.appendChild(style);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",enhanceBoxedWineControls,{once:true});
  }else{
    enhanceBoxedWineControls();
  }

  console.log("[JUEGOS RETRO] BoxedWine local-asset bridge activo");
})();
