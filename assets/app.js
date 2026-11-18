const menuButton = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');
function closeMenu() {
  if (!menuButton || !menu) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menu.classList.remove('open');
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menu?.classList.toggle('open', open);
});
menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
document.addEventListener('click', e => { if (!e.target.closest('.site-header')) closeMenu(); });

const dialog = document.querySelector('#image-viewer');
const viewerImage = dialog?.querySelector('img');
const viewerTitle = dialog?.querySelector('h2');
const download = dialog?.querySelector('[data-download]');
let opener;
document.querySelectorAll('[data-preview]').forEach(button => {
  button.addEventListener('click', () => {
    opener = button;
    viewerImage.src = button.dataset.preview;
    viewerImage.alt = button.dataset.title;
    viewerTitle.textContent = button.dataset.title;
    download.href = button.dataset.preview;
    dialog.showModal();
  });
});
dialog?.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
dialog?.addEventListener('close', () => opener?.focus());
// Hash links, gallery downloads, and policy content remain usable without JavaScript.
