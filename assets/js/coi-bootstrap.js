const COI_VERSION = "jr-coi-v1";

async function enableCrossOriginIsolation(){
  if(!("serviceWorker" in navigator)){
    window.jrIsolationStatus = {supported:false, isolated:self.crossOriginIsolated === true};
    return window.jrIsolationStatus;
  }

  if(self.crossOriginIsolated){
    window.jrIsolationStatus = {supported:true, isolated:true};
    return window.jrIsolationStatus;
  }

  try{
    const swUrl = new URL("../../coi-serviceworker.js", import.meta.url);
    const scopeUrl = new URL("../../", import.meta.url);

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: scopeUrl.pathname,
      updateViaCache: "none"
    });

    await registration.update().catch(()=>{});
    await navigator.serviceWorker.ready;

    const attempted = sessionStorage.getItem(COI_VERSION);

    // Cross-origin isolation is determined at navigation time, so after the
    // service worker takes control we need exactly one reload.
    if(!self.crossOriginIsolated && attempted !== "1"){
      sessionStorage.setItem(COI_VERSION, "1");

      if(!navigator.serviceWorker.controller){
        await new Promise(resolve=>{
          const timer=setTimeout(resolve,1200);
          navigator.serviceWorker.addEventListener("controllerchange",()=>{
            clearTimeout(timer);
            resolve();
          },{once:true});
        });
      }

      location.reload();
      return new Promise(()=>{});
    }

    window.jrIsolationStatus = {
      supported:true,
      isolated:self.crossOriginIsolated === true,
      sharedArrayBuffer:typeof SharedArrayBuffer !== "undefined"
    };
    return window.jrIsolationStatus;
  }catch(error){
    console.warn("[JUEGOS RETRO] No se pudo activar aislamiento para audio:",error);
    window.jrIsolationStatus = {
      supported:true,
      isolated:false,
      error:String(error)
    };
    return window.jrIsolationStatus;
  }
}

window.jrIsolationReady = enableCrossOriginIsolation();
await window.jrIsolationReady;
