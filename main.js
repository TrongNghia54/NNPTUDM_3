// Hàm được yêu cầu: getall (với pagination và proxy ảnh)
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let pageSize = 10;
let currentSort = ''; // e.g. 'price-asc', 'name-desc'

async function getall() {
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Đang tải...';

  try {
    const res = await fetch('https://api.escuelajs.co/api/v1/products');
    if (!res.ok) throw new Error('Lỗi mạng: ' + res.status);
    const products = await res.json();
    allProducts = Array.isArray(products) ? products : [];
    filteredProducts = allProducts.slice();
    currentPage = 1;
    renderPage();
    statusEl.textContent = 'Đã tải ' + allProducts.length + ' sản phẩm.';
    updatePager();
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Lỗi khi tải sản phẩm: ' + err.message;
  }
}

function resolveImageSrc(url){
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (/^\/\//.test(url)) return 'https:' + url;
  return 'https://' + url;
}

function proxiedUrl(url){
  if (!url) return '';
  // Use full URL encoded (works better for some hosts) and request webp output
  return 'https://images.weserv.nl/?url=' + encodeURIComponent(url) + '&w=600&output=webp&q=85';
}

// Probe a URL (HEAD request) with timeout to detect availability
async function probeUrl(url, ms = 3000){
  if (!url) return false;
  try{
    const controller = new AbortController();
    const id = setTimeout(()=>controller.abort(), ms);
    const res = await fetch(url, {method: 'HEAD', mode: 'cors', signal: controller.signal});
    clearTimeout(id);
    return res && res.ok;
  }catch(err){
    // probe failed (network/CORS/timeout)
    return false;
  }
}

// Asynchronously set image src: prefer proxy if available, else original; onerror will still set final placeholder
function setImgSrcWithProbe(img, orig){
  const proxy = proxiedUrl(orig);
  (async ()=>{
    // Try proxy first
    if (proxy){
      try{
        const ok = await probeUrl(proxy, 2500);
        if (ok){ img.src = proxy; img.dataset.proxied = '1'; return; }
      }catch(e){ /* ignore */ }
    }

    // Try original
    try{
      const ok2 = await probeUrl(orig, 2500);
      if (ok2){ img.src = orig; img.dataset.proxied = '0'; return; }
    }catch(e){ /* ignore */ }

    // As a last attempt, set proxy (may still work even if probe couldn't verify)
    if (proxy){ img.src = proxy; img.dataset.proxied = '1'; return; }

    // Leave it to onerror handler to show placeholder
    img.src = orig || '';
  })();
}

function renderProducts(products){
  const tbody = document.getElementById('products-body');
  const statusEl = document.getElementById('status');
  tbody.innerHTML = '';
  if (!Array.isArray(products) || products.length === 0){
    statusEl.textContent = 'Không có sản phẩm hiển thị.';
    return;
  }

  products.forEach(p => {
    const tr = document.createElement('tr');

    const imgTd = document.createElement('td');
    const img = document.createElement('img');
    img.className = 'product-img';
    img.alt = p.title || 'product-image';
    img.loading = 'lazy';
    const orig = (Array.isArray(p.images) && p.images.length) ? p.images[0] : (p.image || '');
    const src = resolveImageSrc(orig);
    img.dataset.orig = src;
    img.loading = 'lazy';

    // onerror: final fallback to placeholder (proxy/orig probing is handled separately)
    img.onerror = function(){
      console.warn('Image load failed (final):', this.dataset.orig, 'currentSrc=', this.src);
      this.onerror = null;
      this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180"><rect width="100%" height="100%" fill="%23ffffff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23888" font-family="Arial" font-size="14">No image</text></svg>';
      this.classList.add('placeholder');
    };

    // Set image source asynchronously by probing proxy first then original
    setImgSrcWithProbe(img, src);
    imgTd.appendChild(img);

    const idTd = document.createElement('td'); idTd.textContent = p.id;
    const titleTd = document.createElement('td'); titleTd.textContent = p.title;
    const priceTd = document.createElement('td'); priceTd.textContent = (p.price != null) ? ('$' + p.price) : '';
    const catTd = document.createElement('td'); catTd.textContent = (p.category && p.category.name) ? p.category.name : '';

    tr.appendChild(imgTd);
    tr.appendChild(idTd);
    tr.appendChild(titleTd);
    tr.appendChild(priceTd);
    tr.appendChild(catTd);

    imgTd.setAttribute('data-label','Hình');
    idTd.setAttribute('data-label','ID');
    titleTd.setAttribute('data-label','Tiêu đề');
    priceTd.setAttribute('data-label','Giá');
    catTd.setAttribute('data-label','Danh mục');

    tbody.appendChild(tr);
  });

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredProducts.length);
  document.getElementById('status').textContent = 'Hiển thị ' + start + '–' + end + ' trong ' + filteredProducts.length + ' sản phẩm.';
}

function applySort(option){
  currentSort = option || '';
  if (!currentSort){
    currentPage = 1;
    renderPage();
    return;
  }
  const [key, dir] = currentSort.split('-');
  filteredProducts.sort((a,b)=>{
    if (key === 'price'){
      const na = Number(a.price) || 0;
      const nb = Number(b.price) || 0;
      return (dir === 'asc') ? (na - nb) : (nb - na);
    }
    if (key === 'name'){
      const sa = (a.title||'').toLowerCase();
      const sb = (b.title||'').toLowerCase();
      if (sa < sb) return (dir === 'asc') ? -1 : 1;
      if (sa > sb) return (dir === 'asc') ? 1 : -1;
      return 0;
    }
    return 0;
  });
  currentPage = 1;
  renderPage();
}

function renderPage(){
  const start = (currentPage - 1) * pageSize;
  const slice = filteredProducts.slice(start, start + pageSize);
  renderProducts(slice);
  updatePager();
}

function updatePager(){
  const pager = document.getElementById('pager');
  if (!pager) return;
  const total = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  pager.innerHTML = '';

  const prev = document.createElement('button');
  prev.textContent = 'Prev';
  prev.disabled = currentPage <= 1;
  prev.addEventListener('click', ()=>{ if (currentPage>1){currentPage--; renderPage();} });
  pager.appendChild(prev);

  // show up to 7 page buttons (simple)
  const maxButtons = 7;
  let startPage = Math.max(1, currentPage - 3);
  let endPage = Math.min(total, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons -1){ startPage = Math.max(1, endPage - maxButtons +1); }

  for (let i = startPage; i <= endPage; i++){
    const b = document.createElement('button');
    b.textContent = i;
    if (i === currentPage) b.classList.add('active');
    b.addEventListener('click', ()=>{ currentPage = i; renderPage(); });
    pager.appendChild(b);
  }

  const next = document.createElement('button');
  next.textContent = 'Next';
  next.disabled = currentPage >= total;
  next.addEventListener('click', ()=>{ if (currentPage < total){ currentPage++; renderPage(); } });
  pager.appendChild(next);
}

function applyFilter(query){
  const q = (query || '').trim().toLowerCase();
  if (!q){
    filteredProducts = allProducts.slice();
  } else {
    filteredProducts = allProducts.filter(p => (p.title || '').toLowerCase().includes(q));
  }
  currentPage = 1;
  applySort(currentSort); // apply any active sort and render
}

// Kết nối UI
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-refresh');
  const search = document.getElementById('search-title');
  const pageSizeSelect = document.getElementById('page-size');

  btn.addEventListener('click', getall);
  // Update realtime khi người dùng nhập
  search.addEventListener('input', (e) => applyFilter(e.target.value));

  // sort change
  const sortSelect = document.getElementById('sort-by');
  sortSelect.addEventListener('change', (e) => applySort(e.target.value));

  // page size change
  pageSizeSelect.addEventListener('change', (e) => {
    pageSize = parseInt(e.target.value, 10) || 10;
    currentPage = 1;
    renderPage();
  });

  // Tải tự động 1 lần khi mở trang
  pageSize = parseInt(pageSizeSelect.value, 10) || 10;
  getall();
});

// Nếu người dùng cần gọi hàm từ console: getall(); applyFilter('shirt');
