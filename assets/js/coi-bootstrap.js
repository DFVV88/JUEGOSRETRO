const CLEANUP_KEY = "jr-audio-coi-cleaned-v1";

async function removeExperimentalIsolation(){
  if(!("serviceWorker" in navigator)) return;

  try{
    const registrations = await navigator.serviceWorker.getRegistrations();
    let removed = false;

    for(const registration of registrations){
      const scriptURL =
        registration.active?.scriptURL ||
        registration.waiting?.scriptURL ||
        registration.installing?.scriptURL ||
        "";

      if(scriptURL.includes("coi-serviceworker.js")){
        removed = (await registration.unregister()) || removed;
      }
    }

    const controllerURL = navigator.serviceWorker.controller?.scriptURL || "";
    const controlledByExperimentalSW = controllerURL.includes("coi-serviceworker.js");

    if(controlledByExperimentalSW && sessionStorage.getItem(CLEANUP_KEY) !== "1"){
      sessionStorage.setItem(CLEANUP_KEY,"1");
      location.reload();
      return new Promise(()=>{});
    }

    if(removed || !controlledByExperimentalSW){
      sessionStorage.removeItem("jr-coi-v1");
    }
  }catch(error){
    console.warn("[JUEGOS RETRO] No se pudo limpiar el Service Worker experimental:",error);
  }
}

await removeExperimentalIsolation();
