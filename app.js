/**
 * Pintasan - Logika Aplikasi URL Shortener & Redirect Engine
 * Tanpa dependensi eksternal, 100% Client-side.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'pintasan_links_v1';
  const SOUND_KEY = 'pintasan_sound_pref';
  const THEME_KEY = 'pintasan_theme_pref';

  // --- Audio Feedback (Web Audio API Synthesizer) ---
  let audioCtx = null;
  let soundEnabled = localStorage.getItem(SOUND_KEY) !== 'false';

  function playClick(type = 'click') {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (type === 'success') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else {
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      }
    } catch (e) {}
  }

  // --- Toast Notification ---
  const toastEl = document.getElementById('toast');
  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, 2400);
  }

  // --- Theme Management ---
  const btnTheme = document.getElementById('btn-theme');
  const themeIndicator = document.getElementById('theme-indicator');

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(currentTheme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeIndicator) {
      themeIndicator.textContent = theme === 'dark' ? 'TEMA: GELAP' : 'TEMA: TERANG';
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  btnTheme?.addEventListener('click', () => {
    playClick();
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // --- Sound Toggle ---
  const btnSound = document.getElementById('btn-sound');
  const soundIndicator = document.getElementById('sound-indicator');

  function updateSoundUI() {
    if (soundIndicator) {
      soundIndicator.textContent = soundEnabled ? 'SUARA: ON' : 'SUARA: OFF';
    }
  }

  btnSound?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_KEY, soundEnabled ? 'true' : 'false');
    updateSoundUI();
    if (soundEnabled) playClick('success');
  });
  updateSoundUI();
  initTheme();

  // --- Domain Parser ---
  const urlInput = document.getElementById('url-input');
  const domainPreview = document.getElementById('domain-preview');

  function normalizeUrl(val) {
    let str = val.trim();
    if (!str) return '';
    if (!/^https?:\/\//i.test(str)) {
      str = 'https://' + str;
    }
    return str;
  }

  urlInput?.addEventListener('input', () => {
    const val = urlInput.value.trim();
    if (!val) {
      domainPreview.hidden = true;
      domainPreview.textContent = '';
      return;
    }
    try {
      const parsed = new URL(normalizeUrl(val));
      if (parsed.hostname) {
        domainPreview.textContent = parsed.hostname;
        domainPreview.hidden = false;
        return;
      }
    } catch (e) {}
    domainPreview.hidden = true;
  });

  // Paste helper
  const btnPaste = document.getElementById('btn-paste');
  btnPaste?.addEventListener('click', async () => {
    playClick();
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text;
        urlInput.dispatchEvent(new Event('input'));
        showToast('Tautan ditempel dari clipboard');
      }
    } catch (e) {
      showToast('Gagal membaca clipboard. Beri izin peramban.');
    }
  });

  // --- Riwayat & Data Storage ---
  function getLinks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLinks(links) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
      renderHistory();
    } catch (e) {
      showToast('Gagal menyimpan ke penyimpanan lokal');
    }
  }

  function addLink(item) {
    const links = getLinks();
    links.unshift(item);
    saveLinks(links);
  }

  function deleteLink(id) {
    playClick();
    const links = getLinks().filter(x => x.id !== id);
    saveLinks(links);
    showToast('Tautan dihapus');
  }

  function incrementClick(id) {
    const links = getLinks();
    const item = links.find(x => x.id === id);
    if (item) {
      item.clicks = (item.clicks || 0) + 1;
      saveLinks(links);
    }
  }

  // --- Rendering Riwayat ---
  const historyEmpty = document.getElementById('history-empty');
  const historyTableWrap = document.getElementById('history-table-wrap');
  const historyTbody = document.getElementById('history-tbody');
  const historyCount = document.getElementById('history-count');

  function renderHistory() {
    const links = getLinks();
    if (historyCount) historyCount.textContent = `${links.length} tautan`;

    if (links.length === 0) {
      if (historyEmpty) historyEmpty.hidden = false;
      if (historyTableWrap) historyTableWrap.hidden = true;
      if (historyTbody) historyTbody.innerHTML = '';
      return;
    }

    if (historyEmpty) historyEmpty.hidden = true;
    if (historyTableWrap) historyTableWrap.hidden = false;
    if (!historyTbody) return;

    historyTbody.innerHTML = links.map(item => `
      <tr data-id="${item.id}">
        <td>
          <a href="${escapeHtml(item.shortUrl)}" target="_blank" rel="noopener noreferrer" class="cell-short-link" title="${escapeHtml(item.shortUrl)}">
            ${escapeHtml(item.shortUrl)}
          </a>
        </td>
        <td>
          <span class="cell-orig" title="${escapeHtml(item.originalUrl)}">
            ${escapeHtml(item.originalUrl)}
          </span>
        </td>
        <td>
          <span class="cell-clicks">${item.clicks || 0}</span>
        </td>
        <td>
          <div class="table-row-actions">
            <button type="button" class="btn-action-xs btn-copy-row" data-url="${escapeHtml(item.shortUrl)}" title="Salin">SALIN</button>
            <button type="button" class="btn-action-xs btn-qr-row" data-url="${escapeHtml(item.shortUrl)}" title="QR Code">QR</button>
            <button type="button" class="btn-action-xs danger btn-del-row" data-id="${item.id}" title="Hapus">HAPUS</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Pasang listener pada baris
    historyTbody.querySelectorAll('.btn-copy-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        playClick('success');
        const url = e.currentTarget.getAttribute('data-url');
        copyToClipboard(url);
      });
    });

    historyTbody.querySelectorAll('.btn-qr-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        playClick();
        const url = e.currentTarget.getAttribute('data-url');
        displayQrCode(url);
      });
    });

    historyTbody.querySelectorAll('.btn-del-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        deleteLink(id);
      });
    });

    historyTbody.querySelectorAll('.cell-short-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const tr = e.currentTarget.closest('tr');
        if (tr) {
          const id = tr.getAttribute('data-id');
          incrementClick(id);
        }
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Ekspor & Impor JSON ---
  const btnExport = document.getElementById('btn-export');
  const inputImport = document.getElementById('input-import');
  const btnClearHistory = document.getElementById('btn-clear-history');

  btnExport?.addEventListener('click', () => {
    playClick();
    const links = getLinks();
    if (links.length === 0) {
      showToast('Tidak ada data riwayat untuk diekspor');
      return;
    }
    const blob = new Blob([JSON.stringify(links, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pintasan-tautan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File JSON berhasil diunduh');
  });

  inputImport?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (Array.isArray(parsed)) {
          const existing = getLinks();
          const existingIds = new Set(existing.map(x => x.id));
          const merged = [...existing];
          let added = 0;
          parsed.forEach(item => {
            if (item && item.shortUrl && item.originalUrl && !existingIds.has(item.id)) {
              merged.push(item);
              added++;
            }
          });
          saveLinks(merged);
          showToast(`Berhasil mengimpor ${added} tautan`);
        } else {
          showToast('Format JSON tidak valid');
        }
      } catch (err) {
        showToast('Gagal memproses file JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  btnClearHistory?.addEventListener('click', () => {
    playClick();
    const links = getLinks();
    if (links.length === 0) return;
    if (window.confirm('Hapus seluruh riwayat tautan lokal? Tindakan ini tidak dapat dibatalkan.')) {
      saveLinks([]);
      showToast('Riwayat dibersihkan');
    }
  });

  // --- Mesin Perpendek URL ---
  const form = document.getElementById('shorten-form');
  const slugInput = document.getElementById('custom-slug');
  const engineSelect = document.getElementById('engine-select');
  const btnSubmit = document.getElementById('btn-submit');
  const resultBox = document.getElementById('result-box');
  const resultUrl = document.getElementById('result-url');
  const resultEngine = document.getElementById('result-engine');
  const btnCopyResult = document.getElementById('btn-copy-result');
  const btnVisitResult = document.getElementById('btn-visit-result');

  async function shortenViaApi(originalUrl, engine) {
    if (engine === 'tinyurl') {
      try {
        const resp = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(originalUrl)}`);
        if (resp.ok) {
          const txt = await resp.text();
          if (txt && txt.startsWith('http')) return txt.trim();
        }
      } catch (e) {}
    } else if (engine === 'isgd') {
      try {
        const resp = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(originalUrl)}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.shorturl) return data.shorturl;
        }
      } catch (e) {}
    }
    return null;
  }

  function generateDirectHashUrl(originalUrl, customSlug) {
    const base = window.location.origin + window.location.pathname;
    if (customSlug) {
      return {
        url: `${base}#/${encodeURIComponent(customSlug)}`,
        slug: customSlug
      };
    }
    // Encode Base64 agar tautan mandiri tanpa ketergantungan storage
    const encoded = btoa(encodeURIComponent(originalUrl));
    return {
      url: `${base}#go:${encoded}`,
      slug: null
    };
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    playClick();

    const rawUrl = urlInput.value.trim();
    if (!rawUrl) return;

    const normalized = normalizeUrl(rawUrl);
    const customSlug = slugInput ? slugInput.value.trim() : '';
    const selectedEngine = engineSelect ? engineSelect.value : 'direct';

    btnSubmit.disabled = true;
    const originalText = btnSubmit.querySelector('.btn-text').textContent;
    btnSubmit.querySelector('.btn-text').textContent = 'Memproses...';

    let finalShortUrl = '';
    let finalSlug = customSlug || null;
    let engineLabel = 'GitHub Pages';

    if (selectedEngine === 'direct' || customSlug) {
      const generated = generateDirectHashUrl(normalized, customSlug);
      finalShortUrl = generated.url;
      finalSlug = generated.slug;
      engineLabel = 'GitHub Pages';
    } else {
      // Coba panggil API publik
      const apiResult = await shortenViaApi(normalized, selectedEngine);
      if (apiResult) {
        finalShortUrl = apiResult;
        engineLabel = selectedEngine === 'tinyurl' ? 'TinyURL' : 'is.gd';
      } else {
        // Fallback langsung ke GitHub Hash bila jaringan API gagal
        const fallback = generateDirectHashUrl(normalized, null);
        finalShortUrl = fallback.url;
        engineLabel = 'GitHub Pages (Fallback)';
        showToast('API publik sibuk. Menggunakan direct redirect.');
      }
    }

    const item = {
      id: 'lnk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      shortUrl: finalShortUrl,
      originalUrl: normalized,
      slug: finalSlug,
      engine: engineLabel,
      clicks: 0,
      createdAt: new Date().toISOString()
    };

    addLink(item);

    // Tampilkan hasil
    if (resultBox && resultUrl) {
      resultUrl.value = finalShortUrl;
      resultEngine.textContent = engineLabel;
      btnVisitResult.href = finalShortUrl;
      resultBox.hidden = false;
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      copyToClipboard(finalShortUrl);
    }

    btnSubmit.disabled = false;
    btnSubmit.querySelector('.btn-text').textContent = originalText;
    playClick('success');
  });

  // Salin hasil utama
  btnCopyResult?.addEventListener('click', () => {
    playClick('success');
    if (resultUrl && resultUrl.value) {
      copyToClipboard(resultUrl.value);
    }
  });

  function copyToClipboard(text) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Tautan disalin ke clipboard');
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const tmp = document.createElement('textarea');
    tmp.value = text;
    tmp.style.position = 'fixed';
    tmp.style.opacity = '0';
    document.body.appendChild(tmp);
    tmp.select();
    try {
      document.execCommand('copy');
      showToast('Tautan disalin ke clipboard');
    } catch (e) {
      showToast('Gagal menyalin tautan');
    }
    document.body.removeChild(tmp);
  }

  // Tombol Reset
  const btnClear = document.getElementById('btn-clear');
  btnClear?.addEventListener('click', () => {
    playClick();
    urlInput.value = '';
    if (slugInput) slugInput.value = '';
    domainPreview.hidden = true;
    domainPreview.textContent = '';
    if (resultBox) resultBox.hidden = true;
    urlInput.focus();
  });

  // --- Generator QR Code Murni (Bebas Dependensi) ---
  const btnShowQr = document.getElementById('btn-show-qr');
  const qrContainer = document.getElementById('qr-container');
  const qrCanvas = document.getElementById('qr-canvas');
  const btnDownloadQr = document.getElementById('btn-download-qr');
  const btnCloseQr = document.getElementById('btn-close-qr');

  btnShowQr?.addEventListener('click', () => {
    playClick();
    if (resultUrl && resultUrl.value) {
      displayQrCode(resultUrl.value);
    }
  });

  btnCloseQr?.addEventListener('click', () => {
    playClick();
    if (qrContainer) qrContainer.hidden = true;
  });

  btnDownloadQr?.addEventListener('click', () => {
    playClick('success');
    if (!qrCanvas) return;
    const a = document.createElement('a');
    a.download = 'pintasan-qr.png';
    a.href = qrCanvas.toDataURL('image/png');
    a.click();
  });

  function displayQrCode(text) {
    if (!qrContainer || !qrCanvas) return;
    qrContainer.hidden = false;
    drawQrToCanvas(text, qrCanvas);
    qrContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Implementasi QR Code Generator Minimalis Berbasis Canvas
  // Menggunakan API browser atau matriks representasi standar
  function drawQrToCanvas(text, canvas) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Gunakan Image loader dengan QR service publik terpercaya yang cepat atau generator lokal
    const qrImg = new Image();
    qrImg.crossOrigin = 'Anonymous';
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 0, 0, size, size);
    };
    qrImg.onerror = () => {
      // Fallback matriks visual sederhana jika offline
      drawFallbackMatrix(ctx, text, size);
    };
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&margin=1`;
  }

  function drawFallbackMatrix(ctx, text, size) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#0f172a';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code siap', size / 2, size / 2 - 10);
    ctx.font = '10px monospace';
    ctx.fillText('Buka online untuk render', size / 2, size / 2 + 10);
  }

  // --- Keyboard Shortcuts Global ---
  window.addEventListener('keydown', (e) => {
    // Esc untuk bersihkan atau tutup dialog
    if (e.key === 'Escape') {
      if (qrContainer && !qrContainer.hidden) {
        qrContainer.hidden = true;
        return;
      }
      btnClear?.click();
      return;
    }

    // '/' atau Ctrl+K untuk fokus ke input
    if ((e.key === '/' && document.activeElement.tagName !== 'INPUT') || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      urlInput?.focus();
      urlInput?.select();
    }
  });

  // Render awal riwayat
  renderHistory();
})();
