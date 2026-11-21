// Click (or Enter) on a figure opens it full-size in a dialog; click anywhere or Esc closes.
// The caption is cloned, not flattened to text, so its metaphor variants keep toggling.
(function(){
  var d=document.createElement('dialog');d.className='zoom';d.setAttribute('aria-label','Enlarged figure');
  document.body.appendChild(d);
  d.addEventListener('click',function(){d.close()});
  document.querySelectorAll('figure.fig .media').forEach(function(m){
    m.addEventListener('click',function(){
      var cap=m.closest('figure').querySelector('figcaption');
      d.innerHTML=m.innerHTML;
      if(cap){var p=document.createElement('p');p.innerHTML=cap.innerHTML;d.appendChild(p);}
      d.showModal();
    });
  });
})();
