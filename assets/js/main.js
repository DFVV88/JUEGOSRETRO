// Tema: oscuro/claro con persistencia
const root = document.documentElement;
const themeBtn = document.getElementById('themeToggle');
const saved = localStorage.getItem('theme');
if(saved === 'light'){ document.body.classList.add('light'); }

themeBtn?.addEventListener('click', ()=>{
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

// Scroll suave para anclas
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href');
    if(id.length > 1){
      e.preventDefault();
      const el = document.querySelector(id);
      el?.scrollIntoView({behavior:'smooth', block:'start'});
    }
  });
});
