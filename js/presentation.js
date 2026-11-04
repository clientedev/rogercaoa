/**
 * CAOA Seminovos - Motor de Apresentação Executiva 16:9
 * Gestão de slides, gráficos dinâmicos com gradientes, QR Code e responsividade
 */

const Presentation = (function () {
  let currentSlide = 1;
  const totalSlides = 15;
  let autoPlayInterval = null;
  let autoPlayActive = false;
  let isToolbarVisible = true;
  let isLaserActive = false;
  const charts = {};


  function init() {
    setupResponsiveScaling();
    setupEventListeners();
    initQRCode();
    initCharts();
    goToSlide(1);
  }

  // Generate dynamic QR Code matching the exact URL where presentation is opened
  function initQRCode() {
    const container = document.getElementById('dynamic-qrcode');
    if (!container) return;

    let targetUrl = window.location.href;
    // If opened via file:// protocol, default to network IP address
    if (window.location.protocol === 'file:') {
      targetUrl = 'http://10.83.3.16:8080';
    }

    const linkEl = document.getElementById('qr-link-text');
    if (linkEl) {
      linkEl.innerText = targetUrl.replace('http://', '').replace('https://', '');
      linkEl.href = targetUrl;
    }

    if (typeof QRCode !== 'undefined') {
      container.innerHTML = '';
      try {
        new QRCode(container, {
          text: targetUrl,
          width: 176,
          height: 176,
          colorDark: '#1D184B',
          colorLight: '#FFFFFF',
          correctLevel: QRCode.CorrectLevel.M
        });
        return;
      } catch (err) {
        console.warn('QRCode JS error, using fallback image', err);
      }
    }

    // Fallback static image
    container.innerHTML = `<img src="assets/qrcode.png" alt="QR Code" style="width:100%;height:100%;object-fit:contain;">`;
  }

  // 16:9 Mathematical Responsive Scaling - Reserves space so toolbar NEVER covers content
    // ==========================================
  // PRESENTER LASER POINTER ENGINE
  // ==========================================
  let laserX = 0, laserY = 0, laserTicking = false;

  function toggleLaser() {
    isLaserActive = !isLaserActive;
    const btn = document.getElementById('btn-laser');
    const laser = document.getElementById('laser-pointer');
    
    if (isLaserActive) {
      document.body.classList.add('laser-active');
      if (btn) btn.classList.add('laser-active-btn');
      window.addEventListener('mousemove', onLaserMouseMove);
      window.addEventListener('click', onLaserClick);
    } else {
      document.body.classList.remove('laser-active');
      if (btn) btn.classList.remove('laser-active-btn');
      window.removeEventListener('mousemove', onLaserMouseMove);
      window.removeEventListener('click', onLaserClick);
    }
  }

  function onLaserMouseMove(e) {
    laserX = e.clientX;
    laserY = e.clientY;
    if (!laserTicking) {
      requestAnimationFrame(() => {
        const laser = document.getElementById('laser-pointer');
        if (laser) {
          laser.style.left = laserX + 'px';
          laser.style.top = laserY + 'px';
        }
        laserTicking = false;
      });
      laserTicking = true;
    }
  }

  function onLaserClick(e) {
    if (!isLaserActive) return;
    const ripple = document.createElement('div');
    ripple.className = 'laser-ripple';
    ripple.style.left = e.clientX + 'px';
    ripple.style.top = e.clientY + 'px';
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 550);
  }

  // ==========================================
  // HIGH-FIDELITY PDF REPORT GENERATION
  // ==========================================
  function downloadPDFReport() {
    // Direct download of the real executive PDF report
    const link = document.createElement('a');
    link.href = 'assets/Relatorio_Executivo_CAOA_Seminovos_Outubro_2026.pdf';
    link.download = 'Relatorio_Executivo_CAOA_Seminovos_Outubro_2026.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      link.remove();
    }, 150);
  }

  
  // Interactive Chart Click Feedback Engine
  function showChartInsight(title, text) {
    let chip = document.getElementById('chart-interactive-chip');
    if (!chip) {
      chip = document.createElement('div');
      chip.id = 'chart-interactive-chip';
      chip.className = 'chart-interactive-chip';
      document.body.appendChild(chip);
    }
    chip.innerHTML = `<strong>${title}</strong> <span>${text}</span>`;
    chip.classList.add('visible');
    clearTimeout(window._chipTimeout);
    window._chipTimeout = setTimeout(() => {
      chip.classList.remove('visible');
    }, 3800);
  }

  function setupResponsiveScaling() {
    const stage = document.getElementById('slide-stage');
    if (!stage) return;

    function resize() {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // On mobile screens (<= 1024px), CSS handles layout natively
      if (windowWidth <= 1024) {
        stage.style.transform = '';
        stage.style.left = '';
        stage.style.top = '';
        return;
      }

      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);

      // In fullscreen, use full screen dimensions without reserved bottom
      const reservedBottom = isFs ? 0 : (isToolbarVisible ? 60 : 12);
      const paddingX = isFs ? 0 : 20;
      const paddingY = isFs ? 0 : 12;

      const availW = Math.max(windowWidth - paddingX, 320);
      const availH = Math.max(windowHeight - reservedBottom - paddingY, 200);

      const scale = Math.min(availW / 1920, availH / 1080);

      stage.style.transform = `scale(${scale})`;

      // Mathematically center stage
      const scaledW = 1920 * scale;
      const leftPos = (windowWidth - scaledW) / 2;
      stage.style.left = `${leftPos}px`;

      const scaledH = 1080 * scale;
      const topPos = isFs ? Math.max((windowHeight - scaledH) / 2, 0) : Math.max(((windowHeight - reservedBottom) - scaledH) / 2, 6);
      stage.style.top = `${topPos}px`;
    }

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    document.addEventListener('fullscreenchange', () => { setTimeout(resize, 60); setTimeout(resize, 200); });
    document.addEventListener('webkitfullscreenchange', () => { setTimeout(resize, 60); setTimeout(resize, 200); });
    document.addEventListener('mozfullscreenchange', () => { setTimeout(resize, 60); setTimeout(resize, 200); });
    document.addEventListener('MSFullscreenChange', () => { setTimeout(resize, 60); setTimeout(resize, 200); });

    window._recalculateScale = resize;
    resize();
  }

  function setupEventListeners() {
    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
        case 'l':
        case 'L':
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
        case 'h':
        case 'H':
          prevSlide();
          break;
        case 'Home':
          goToSlide(1);
          break;
        case 'End':
          goToSlide(totalSlides);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'p':
        case 'P':
          toggleAutoPlay();
          break;
        case 'o':
        case 'O':
        case 'g':
        case 'G':
          toggleOverview();
          break;
        case 'b':
        case 'B':
        case 't':
        case 'T':
          toggleToolbar();
          break;
        case 'z':
        case 'Z':
          toggleSuperZoom();
          break;
        case 'Escape':
          closeModals();
          break;
      }
    });

    // Touch Swipe Support
    let touchStartX = 0;
    let touchEndX = 0;
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 50) {
        nextSlide();
      } else if (touchEndX - touchStartX > 50) {
        prevSlide();
      }
    }, { passive: true });

    // Auto reveal toolbar when mouse is near bottom if hidden
    document.addEventListener('mousemove', (e) => {
      if (!isToolbarVisible && e.clientY > window.innerHeight - 50) {
        const miniBtn = document.getElementById('toolbar-show-btn');
        if (miniBtn) miniBtn.classList.add('hover-reveal');
      }
    });
  }

  function toggleToolbar() {
    isToolbarVisible = !isToolbarVisible;
    const toolbar = document.getElementById('nav-toolbar');
    const miniBtn = document.getElementById('toolbar-show-btn');
    if (toolbar) {
      if (isToolbarVisible) {
        toolbar.classList.remove('hidden');
        if (miniBtn) miniBtn.classList.remove('visible');
      } else {
        toolbar.classList.add('hidden');
        if (miniBtn) miniBtn.classList.add('visible');
      }
    }
    if (window._recalculateScale) {
      window._recalculateScale();
    }
  }

  function toggleSuperZoom() {
    const isSuper = document.body.classList.toggle('super-zoom');
    const btn = document.getElementById('btn-super-zoom');
    if (btn) {
      btn.innerHTML = isSuper ? '🔍 Zoom Max: ON' : '🔍 Zoom Max';
      if (isSuper) {
        btn.classList.add('primary');
      } else {
        btn.classList.remove('primary');
      }
    }
  }

  function goToSlide(n) {
    if (n < 1) n = 1;
    if (n > totalSlides) n = totalSlides;

    currentSlide = n;

    document.querySelectorAll('.slide').forEach((slide, idx) => {
      const slideNum = idx + 1;
      slide.classList.remove('active', 'prev-slide');
      if (slideNum === currentSlide) {
        slide.classList.add('active');
      } else if (slideNum < currentSlide) {
        slide.classList.add('prev-slide');
      }
    });

    // Scroll to top on mobile
    if (window.innerWidth <= 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update Toolbar State
    const counter = document.getElementById('nav-counter');
    if (counter) {
      counter.innerText = `${String(currentSlide).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
    }

    const progressFill = document.getElementById('nav-progress-fill');
    if (progressFill) {
      const pct = (currentSlide / totalSlides) * 100;
      progressFill.style.width = `${pct}%`;
    }

    // Trigger Chart Updates on the active slide
    renderChartForSlide(currentSlide);
  }

  function nextSlide() {
    if (currentSlide < totalSlides) {
      goToSlide(currentSlide + 1);
    } else if (autoPlayActive) {
      goToSlide(1);
    }
  }

  function prevSlide() {
    if (currentSlide > 1) {
      goToSlide(currentSlide - 1);
    }
  }

  function toggleFullscreen() {
    const doc = document;
    const docEl = document.documentElement;
    const isFs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

    if (!isFs) {
      const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
      if (req) {
        req.call(docEl).then(() => {
          setTimeout(() => { if (window._recalculateScale) window._recalculateScale(); }, 80);
        }).catch((err) => {
          console.warn('Fullscreen request failed:', err);
        });
      }
    } else {
      const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
      if (exit) {
        exit.call(doc).then(() => {
          setTimeout(() => { if (window._recalculateScale) window._recalculateScale(); }, 80);
        }).catch((err) => {
          console.warn('Exit fullscreen failed:', err);
        });
      }
    }
  }

  function toggleAutoPlay() {
    autoPlayActive = !autoPlayActive;
    const btn = document.getElementById('btn-autoplay');
    if (autoPlayActive) {
      if (btn) btn.innerHTML = '⏸ Pausar';
      autoPlayInterval = setInterval(nextSlide, 7000);
    } else {
      if (btn) btn.innerHTML = '▶ Auto';
      clearInterval(autoPlayInterval);
    }
  }

  function toggleOverview() {
    const modal = document.getElementById('overview-modal');
    if (modal) {
      const isOpening = !modal.classList.contains('active');
      modal.classList.toggle('active');
      if (isOpening) {
        // Highlight active slide thumbnail
        document.querySelectorAll('.thumb-card').forEach(card => {
          const slideNum = parseInt(card.getAttribute('data-slide'));
          if (slideNum === currentSlide) {
            card.classList.add('active-thumb');
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            card.classList.remove('active-thumb');
          }
        });
      }
    }
  }

  function closeModals() {
    const overview = document.getElementById('overview-modal');
    if (overview) overview.classList.remove('active');
  }

  // Chart Initializers with Luxury CAOA Seminovos Visual Palette & Custom Tooltips
  function initCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded yet, charts will initialize dynamically.');
      return;
    }

    Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
    Chart.defaults.color = '#5A6273';
  }

  function renderChartForSlide(slideNum) {
    if (typeof Chart === 'undefined') return;

    if (slideNum === 2 && !charts['chart-slide2']) {
      createSlide2Chart();
    } else if (slideNum === 4 && !charts['chart-slide4-a']) {
      createSlide4Charts();
    } else if (slideNum === 5 && !charts['chart-slide5']) {
      createSlide5Chart();
    } else if (slideNum === 7 && !charts['chart-slide7']) {
      createSlide7Chart();
    } else if (slideNum === 13 && !charts['chart-slide13']) {
      createSlide13Chart();
    } else if (slideNum === 14 && !charts['chart-slide14']) {
      createSlide14Chart();
    }
  }

  // Slide 2: Volume de Vendas 2026 with Rich Gradients & Hover Effects
  function createSlide2Chart() {
    const ctx = document.getElementById('chart-slide2');
    if (!ctx) return;
    const chartContext = ctx.getContext('2d');

    // Linear Gradients for Premium Visual Effect
    const navyGradient = chartContext.createLinearGradient(0, 0, 0, 300);
    navyGradient.addColorStop(0, '#2F2774');
    navyGradient.addColorStop(1, '#151138');

    const mintGradient = chartContext.createLinearGradient(0, 0, 0, 300);
    mintGradient.addColorStop(0, 'rgba(100, 194, 149, 0.65)');
    mintGradient.addColorStop(1, 'rgba(100, 194, 149, 0.18)');

    charts['chart-slide2'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV (Meta)'],
        datasets: [
          {
            type: 'line',
            label: 'Margem $ (R$)',
            data: [null, 3251, 4137, 4428, 4212, 3547, 3428, 3516, 2874, 3069, 2704],
            borderColor: '#64C295',
            backgroundColor: '#64C295',
            borderWidth: 3.5,
            pointBackgroundColor: '#FFFFFF',
            pointBorderColor: '#64C295',
            pointBorderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 9,
            pointHoverBackgroundColor: '#1D184B',
            pointHoverBorderColor: '#64C295',
            yAxisID: 'y1',
            tension: 0.3
          },
          {
            type: 'bar',
            label: 'Volume Realizado',
            data: [2423, 1307, 1747, 2245, 2208, 2223, 2324, 2485, 2584, 2505, null],
            backgroundColor: navyGradient,
            hoverBackgroundColor: '#64C295',
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            type: 'bar',
            label: 'Meta Projetada (Novembro)',
            data: [null, null, null, null, null, null, null, null, null, null, 3500],
            backgroundColor: mintGradient,
            borderColor: '#64C295',
            borderWidth: 2,
            borderDash: [5, 5],
            hoverBackgroundColor: 'rgba(100, 194, 149, 0.8)',
            borderRadius: 6,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { weight: 700, size: 12 }, padding: 15 }
          },
          tooltip: {
            backgroundColor: '#1D184B',
            titleFont: { size: 13, weight: 700 },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 10,
            borderColor: 'rgba(100, 194, 149, 0.4)',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Volume de Vendas (unidades)', font: { weight: 700 } },
            grid: { color: '#E2E8F0' },
            min: 0,
            max: 4000
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Margem $ (R$)', font: { weight: 700 } },
            grid: { drawOnChartArea: false },
            min: 0,
            max: 5000
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // Slide 4: Mesa de Avaliação Mensal (2 Gráficos)
  function createSlide4Charts() {
    const ctxA = document.getElementById('chart-slide4-a');
    if (ctxA) {
      charts['chart-slide4-a'] = new Chart(ctxA, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'],
          datasets: [
            {
              type: 'line',
              label: '% Trade In',
              data: [39.82, 33.88, 37.33, 32.54, 38.97, 31.80, 39.56, 40.91, 36.00, 43.31],
              borderColor: '#64C295',
              backgroundColor: '#64C295',
              borderWidth: 3,
              pointRadius: 5,
              pointHoverRadius: 8,
              yAxisID: 'y1'
            },
            {
              type: 'bar',
              label: 'Vendas Varejo Novos',
              data: [3139, 4280, 6818, 5836, 6551, 6955, 5731, 7587, 5834, 4980],
              backgroundColor: '#1D184B',
              hoverBackgroundColor: '#2F2774',
              borderRadius: 4,
              yAxisID: 'y'
            },
            {
              type: 'bar',
              label: 'Captações na Troca',
              data: [1250, 1450, 2545, 1899, 2553, 2212, 2267, 3104, 2100, 2157],
              backgroundColor: '#154578',
              hoverBackgroundColor: '#64C295',
              borderRadius: 4,
              yAxisID: 'y'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 14, font: { size: 13, weight: 700 } } },
            tooltip: {
              callbacks: {
                title: (items) => `📅 Mês: ${items[0].label} 2026`,
                label: (ctx) => {
                  if (ctx.dataset.type === 'line') {
                    return ` 🎯 Taxa de Trade In: ${ctx.raw}% ${ctx.dataIndex === 9 ? '👑 RECORDE HISTÓRICO' : ''}`;
                  }
                  return ` 📊 ${ctx.dataset.label}: ${ctx.raw.toLocaleString('pt-BR')} unidades`;
                }
              }
            }
          },
          scales: {
            y: { grid: { color: '#E2E8F0' }, title: { display: true, text: 'Volume' } },
            y1: {
              position: 'right',
              grid: { drawOnChartArea: false },
              title: { display: true, text: '% Trade In' },
              ticks: { callback: v => v + '%' },
              min: 25,
              max: 50
            },
            x: { grid: { display: false } }
          }
        }
      });
    }

    const ctxB = document.getElementById('chart-slide4-b');
    if (ctxB) {
      charts['chart-slide4-b'] = new Chart(ctxB, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'],
          datasets: [
            {
              type: 'line',
              label: '% Conversão',
              data: [18.85, 12.64, 26.64, 21.03, 24.68, 23.56, 21.20, 19.81, 19.10, 18.30],
              borderColor: '#154578',
              backgroundColor: '#154578',
              borderWidth: 3,
              pointRadius: 5,
              pointHoverRadius: 8,
              yAxisID: 'y1'
            },
            {
              type: 'bar',
              label: 'Qtd. Avaliações',
              data: [6633, 11474, 9552, 9030, 10344, 9387, 10694, 15669, 10993, 11785],
              backgroundColor: '#64C295',
              hoverBackgroundColor: '#1D184B',
              borderRadius: 4,
              yAxisID: 'y'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 14, font: { size: 13, weight: 700 } } },
            tooltip: {
              callbacks: {
                title: (items) => `📅 Mês: ${items[0].label} 2026`,
                label: (ctx) => {
                  if (ctx.dataset.type === 'line') {
                    return ` 📈 Conversão: ${ctx.raw}%`;
                  }
                  return ` 🔍 ${ctx.dataset.label}: ${ctx.raw.toLocaleString('pt-BR')} avaliações`;
                }
              }
            }
          },
          scales: {
            y: { grid: { color: '#E2E8F0' }, title: { display: true, text: 'Avaliações' } },
            y1: {
              position: 'right',
              grid: { drawOnChartArea: false },
              title: { display: true, text: '% Conversão' },
              ticks: { callback: v => v + '%' },
              min: 10,
              max: 30
            },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }

  // Slide 5: Comparativo por Marca
  function createSlide5Chart() {
    const ctx = document.getElementById('chart-slide5');
    if (!ctx) return;

    charts['chart-slide5'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['CHERY', 'CHANGAN', 'HYUNDAI', 'FORD', 'NACIONAL (TOTAL)'],
        datasets: [
          {
            label: '% Trade In VN (Outubro)',
            data: [39.12, 37.09, 69.26, 84.09, 43.31],
            backgroundColor: '#1D184B',
            hoverBackgroundColor: '#2F2774',
            borderRadius: 6
          },
          {
            label: 'Média Ano % Trade In',
            data: [33.87, 27.16, 59.49, 62.98, 37.32],
            backgroundColor: '#64C295',
            hoverBackgroundColor: '#3BA06E',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { weight: 700, size: 12 } } },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.raw}%`
            }
          }
        },
        scales: {
          y: {
            grid: { color: '#E2E8F0' },
            ticks: { callback: v => v + '%' },
            max: 100
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Slide 7: Distribuição de Vendas por Marca
  function createSlide7Chart() {
    const ctx = document.getElementById('chart-slide7');
    if (!ctx) return;

    charts['chart-slide7'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['CHERY (1.569)', 'HYUNDAI (580)', 'CHANGAN (308)', 'FORD (48)'],
        datasets: [
          {
            data: [1569, 580, 308, 48],
            backgroundColor: ['#1D184B', '#154578', '#64C295', '#F08C00'],
            borderWidth: 3,
            borderColor: '#FFFFFF',
            hoverOffset: 12
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { weight: 700, size: 13 }, padding: 16 } },
          tooltip: {
            callbacks: {
              title: (items) => `🚗 ${items[0].label}`,
              label: (ctx) => {
                const total = 2505;
                const pct = ((ctx.raw / total) * 100).toFixed(1);
                return [
                  ` Volume Vendido: ${ctx.raw.toLocaleString('pt-BR')} unidades`,
                  ` Participação de Vendas: ${pct}% do Total da Rede (2.505 un)`
                ];
              }
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  // Slide 13: Marcas Consideradas na Troca
  function createSlide13Chart() {
    const ctx = document.getElementById('chart-slide13');
    if (!ctx) return;

    charts['chart-slide13'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [
          'JEEP', 'VOLKSWAGEN', 'HYUNDAI', 'CHEVROLET', 'TOYOTA', 'FIAT',
          'HONDA', 'NISSAN', 'FORD', 'RENAULT', 'PEUGEOT', 'MITSUBISHI',
          'CITROËN', 'BMW', 'OUTROS'
        ],
        datasets: [
          {
            label: 'Participação nas Trocas (3º Trim 2026)',
            data: [13.4, 12.5, 9.8, 9.5, 9.4, 9.0, 8.3, 5.0, 4.3, 3.0, 2.0, 1.8, 1.7, 1.4, 5.3],
            backgroundColor: (ctx) => {
              const idx = ctx.dataIndex;
              if (idx === 0) return '#1D184B'; // Jeep
              if (idx === 1) return '#154578'; // VW
              if (idx === 4) return '#64C295'; // Toyota
              return 'rgba(29, 24, 75, 0.65)';
            },
            hoverBackgroundColor: '#64C295',
            borderRadius: 6
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => `🚙 Marca Conquistada: ${items[0].label}`,
              label: (ctx) => [
                ` Participação nas Trocas: ${ctx.raw}%`,
                ctx.dataIndex < 2 ? '🔥 Principal Concorrente Canibalizada pelos Tiggos' : 'Captação Ativa de Mercado'
              ]
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#E2E8F0' },
            ticks: { callback: v => v + '%' },
            max: 16
          },
          y: {
            grid: { display: false },
            ticks: { font: { weight: 700, size: 12 } }
          }
        }
      }
    });
  }

  // Slide 14: Matriz dos 40 Seminovos (Scatter Plot) with Supreme Tiggo Spotlight
  function createSlide14Chart() {
    const ctx = document.getElementById('chart-slide14');
    if (!ctx) return;

    const models = [
      { name: '👑 TIGGO 7 (CAMPEÃO)', x: 32, y: 11.5, type: 'tiggo-star' },
      { name: '⭐ TIGGO 5X (GIRO DE OURO)', x: 29, y: 9.8, type: 'tiggo-star' },
      { name: 'Kwid', x: 26, y: 12.0, type: 'ideal' },
      { name: 'Mobi', x: 28, y: 11.0, type: 'ideal' },
      { name: 'Onix', x: 35, y: 10.2, type: 'ideal' },
      { name: 'HB20', x: 38, y: 9.2, type: 'ideal' },
      { name: 'Cronos', x: 34, y: 10.0, type: 'ideal' },
      { name: '208', x: 30, y: 10.5, type: 'ideal' },
      { name: 'Tracker', x: 55, y: 8.8, type: 'neutral' },
      { name: 'T-Cross', x: 58, y: 8.5, type: 'neutral' },
      { name: 'Compass', x: 65, y: 7.8, type: 'neutral' },
      { name: 'Kicks', x: 62, y: 8.0, type: 'neutral' },
      { name: 'Creta', x: 54, y: 8.2, type: 'neutral' },
      { name: 'Pulse', x: 50, y: 8.4, type: 'neutral' },
      { name: 'Nivus', x: 48, y: 8.6, type: 'neutral' },
      { name: 'Song Pro', x: 42, y: 9.5, type: 'neutral' },
      { name: 'Corolla Cross', x: 68, y: 7.2, type: 'neutral' },
      { name: 'Hilux', x: 78, y: 5.5, type: 'attention' },
      { name: 'Ranger', x: 75, y: 5.8, type: 'attention' },
      { name: 'Montana', x: 36, y: 6.2, type: 'attention' },
      { name: 'Duster', x: 33, y: 6.8, type: 'attention' },
      { name: 'Haval H6', x: 70, y: 6.5, type: 'attention' }
    ];

    charts['chart-slide14'] = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: '🏆 SUPREMACIA TIGGO (Tiggo 7 & 5x)',
            data: models.filter(m => m.type === 'tiggo-star'),
            backgroundColor: '#64C295',
            borderColor: '#1D184B',
            borderWidth: 3,
            pointRadius: 13,
            pointHoverRadius: 17,
            pointHoverBackgroundColor: '#1D184B',
            pointHoverBorderColor: '#64C295'
          },
          {
            label: 'Cenário Ideal',
            data: models.filter(m => m.type === 'ideal'),
            backgroundColor: '#154578',
            pointRadius: 7
          },
          {
            label: 'Cenário Neutro',
            data: models.filter(m => m.type === 'neutral'),
            backgroundColor: '#8A94A6',
            pointRadius: 6
          },
          {
            label: 'Atenção / Precificação',
            data: models.filter(m => m.type === 'attention'),
            backgroundColor: '#E03131',
            pointRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { weight: 700, size: 12 }, padding: 14 } },
          tooltip: {
            callbacks: {
              title: (items) => items[0].raw.name,
              label: (ctx) => {
                const item = ctx.raw;
                if (item.type === 'tiggo-star') {
                  return [
                    `⭐ RENTABILIDADE SOBERANA: ${item.y}% de Margem Bruta`,
                    `🚀 Penetração de Mercado: ${item.x}%`,
                    `👑 O Modelo Mais Desejado e Rentável da CAOA Seminovos (0KM)`
                  ];
                }
                const cat = item.type === 'ideal' ? 'Cenário Ideal (Alto Giro e Margem)' : item.type === 'neutral' ? 'Cenário Neutro (Equilíbrio de Volume)' : 'Atenção Operacional (Monitorar Precificação)';
                return [
                  `Margem Bruta: ${item.y}%`,
                  `Penetração de Mercado: ${item.x}%`,
                  `Classificação: ${cat}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: '% Penetração / Dias de Giro Mercado', font: { weight: 700 } },
            grid: { color: '#E2E8F0' },
            min: 20,
            max: 85
          },
          y: {
            title: { display: true, text: 'Margem Bruta (%)', font: { weight: 700 } },
            grid: { color: '#E2E8F0' },
            ticks: { callback: v => v + '%' },
            min: 4,
            max: 14
          }
        }
      }
    });
  }

  const Presentation = {
    // Presentation Exports
    init,
    goToSlide,
    nextSlide,
    prevSlide,
    toggleFullscreen,
    toggleAutoPlay,
    toggleOverview,
    toggleToolbar,
    toggleSuperZoom,
    toggleLaser,
    downloadPDFReport,
    closeModals
  };
  window.Presentation = Presentation;
  return Presentation;
})();

document.addEventListener('DOMContentLoaded', Presentation.init);
