document.addEventListener('DOMContentLoaded', () => {
    // DOM Elementleri
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const fileSelectedInfo = document.getElementById('file-selected-info');
    const selectedFilename = document.getElementById('selected-filename');
    const selectedFilesize = document.getElementById('selected-filesize');
    const nextToDepartmentBtn = document.getElementById('next-to-department');
    const backToUploadBtn = document.getElementById('back-to-upload');
    const backToDepartmentBtn = document.getElementById('back-to-department');
    const nextToPdfBtn = document.getElementById('next-to-pdf'); // Yeni
    const backToSummaryBtn = document.getElementById('back-to-summary'); // Yeni
    const downloadPdfBtn = document.getElementById('download-pdf-btn'); // Yeni
    const newReportFinalBtn = document.getElementById('new-report-final'); // Yeni
    const departmentSelect = document.getElementById('department-select');
    const departmentInfo = document.getElementById('department-info');
    const selectedDepartmentName = document.getElementById('selected-department-name');
    const columnCount = document.getElementById('column-count');
    const configureReportBtn = document.getElementById('configure-report-btn');
    const reportResults = document.getElementById('report-results');

    // Global Değişkenler
    let workbookSheets = {}; // { sheetName: { columns: [], data: [] } }
    let currentPage = 1;

    // --- SAYFA NAVİGASYONU (WIZARD) ---
    window.goToPage = function (pageNumber) {
        // Tüm sayfaları gizle
        document.querySelectorAll('.wizard-page').forEach(page => page.classList.remove('active'));

        // Hedef sayfayı göster
        const targetPage = document.getElementById(`page-${pageNumber}`);
        if (targetPage) targetPage.classList.add('active');

        // Progress steps güncelle
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.remove('active', 'completed');
            const stepNum = index + 1;
            if (stepNum < pageNumber) {
                step.classList.add('completed');
            } else if (stepNum === pageNumber) {
                step.classList.add('active');
            }
        });

        currentPage = pageNumber;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- DOSYA YÜKLEME ---
    browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFiles(e.target.files);
    });

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--thy-red)';
        dropZone.style.backgroundColor = '#fff5f5';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#cbd5e0';
        dropZone.style.backgroundColor = '';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#cbd5e0';
        dropZone.style.backgroundColor = '';
        if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    });

    function handleFiles(files) {
        const file = files[0];
        const extension = file.name.split('.').pop().toLowerCase();

        if (!['xlsx', 'xls', 'csv'].includes(extension)) {
            alert('Lütfen geçerli bir Excel (.xlsx, .xls) veya CSV dosyası yükleyin.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                workbookSheets = {};
                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    if (jsonData.length > 0) {
                        workbookSheets[sheetName] = {
                            columns: jsonData[0],
                            data: jsonData.slice(1)
                        };
                    }
                });

                // Başarılı yükleme arayüzü
                selectedFilename.textContent = file.name;
                selectedFilesize.textContent = formatBytes(file.size);
                fileSelectedInfo.classList.remove('hidden');
                dropZone.style.display = 'none';

                populateDepartmentDropdown();
            } catch (error) {
                alert('Dosya okunurken hata oluştu: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // --- MÜDÜRLÜK ETKİLEŞİMLERİ ---
    function populateDepartmentDropdown() {
        departmentSelect.innerHTML = '<option value="">Müdürlük seçin...</option>';
        Object.keys(workbookSheets).forEach(sheetName => {
            const option = document.createElement('option');
            option.value = sheetName;
            option.textContent = sheetName;
            departmentSelect.appendChild(option);
        });
    }

    departmentSelect.addEventListener('change', () => {
        const selected = departmentSelect.value;
        if (selected) {
            const info = workbookSheets[selected];
            selectedDepartmentName.textContent = selected;
            // Kolon sayısı kaldırıldı
            departmentInfo.classList.remove('hidden');
        } else {
            departmentInfo.classList.add('hidden');
        }
    });

    // --- BUTON TIKLAMALARI ---
    nextToDepartmentBtn.addEventListener('click', () => goToPage(2));
    backToUploadBtn.addEventListener('click', () => goToPage(1));
    backToDepartmentBtn.addEventListener('click', () => {
        goToPage(2);
    });

    nextToPdfBtn.addEventListener('click', () => {
        goToPage(4);
    });

    backToSummaryBtn.addEventListener('click', () => {
        goToPage(3);
    });

    newReportFinalBtn.addEventListener('click', () => {
        if (confirm('Yeni bir rapor oluşturmak istiyor musunuz?')) {
            location.reload();
        }
    });

    downloadPdfBtn.addEventListener('click', async () => {
        const btnText = downloadPdfBtn.innerHTML;
        downloadPdfBtn.innerHTML = '⏳ Rapor Hazırlanıyor...';
        downloadPdfBtn.disabled = true;
        try {
            await exportToPDF();
        } catch (error) {
            console.error('PDF Error:', error);
            alert('PDF oluşturulurken bir hata oluştu.');
        } finally {
            downloadPdfBtn.innerHTML = btnText;
            downloadPdfBtn.disabled = false;
        }
    });

    newReportFinalBtn.addEventListener('click', () => {
        if (confirm('Yeni bir rapor oluşturmak istiyor musunuz?')) {
            location.reload();
        }
    });

    // --- RAPOR OLUŞTURMA ---
    configureReportBtn.addEventListener('click', () => {
        const dept = departmentSelect.value;
        if (!dept) {
            alert('Lütfen bir müdürlük seçin');
            return;
        }
        generateReport(dept, workbookSheets[dept]);
    });

    // --- ÜRÜN BAZLI ANALİZ DEĞİŞKENLERİ ---
    let currentDeptData = null; // Aktif müdürlük verisi
    let currentProductData = null; // Filtrelenmiş veri

    // Tab ve Ürün elementleri
    const tabBtns = document.querySelectorAll('.tab-btn');
    const productFilterArea = document.getElementById('product-filter-area');
    const productSelect = document.getElementById('product-select');

    // Tab Geçişleri
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Aktif tab'ı güncelle
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.dataset.tab;
            if (tab === 'product') {
                productFilterArea.classList.remove('hidden');
                // Eğer ürün seçiliyse onu göster, yoksa boşı göster
                filterReportByProduct(productSelect.value);
            } else {
                productFilterArea.classList.add('hidden');
                // Genel müdürlük raporunu göster (filtresiz)
                filterReportByProduct('');
            }
        });
    });

    // Ürün Seçimi
    productSelect.addEventListener('change', () => {
        filterReportByProduct(productSelect.value);
    });

    function generateReport(deptName, deptData) {
        currentDeptData = deptData; // Veriyi sakla
        document.getElementById('report-department-name').textContent = `Müdürlük: ${deptName}`;

        // Ürün listesini doldur
        const headers = deptData.columns;
        // Ürün kolonunu bul (Büyük/küçük harf duyarlı olabilir, varyasyonları dene)
        let colIndexProduct = headers.findIndex(h => h && ['ürün', 'urun', 'product', 'proje', 'project'].includes(h.toString().trim().toLowerCase()));

        // Varsayılan (tahmini) indeks: 2. kolon (C sütunu)
        if (colIndexProduct === -1) colIndexProduct = 2;

        // Benzersiz ürünleri bul
        const products = new Set();
        deptData.data.forEach(row => {
            const prod = row[colIndexProduct];
            if (prod) products.add(prod.toString().trim());
        });

        // Dropdown'ı doldur
        productSelect.innerHTML = '<option value="">-- Bir Ürün Seçiniz --</option>';
        Array.from(products).sort().forEach(prod => {
            const opt = document.createElement('option');
            opt.value = prod;
            opt.textContent = prod;
            productSelect.appendChild(opt);
        });

        // İlk açılışta Genel Raporu Göster
        document.querySelector('[data-tab="general"]').click(); // Genel tabına tıkla

        // 3. Sayfaya Geç
        goToPage(3);
    }

    function filterReportByProduct(productName) {
        if (!currentDeptData) return;

        let filteredRows = currentDeptData.data;

        // Eğer ürün seçiliyse filtrele
        if (productName) {
            const headers = currentDeptData.columns;
            let colIndexProduct = headers.findIndex(h => h && ['ürün', 'urun', 'product', 'proje', 'project'].includes(h.toString().trim().toLowerCase()));
            if (colIndexProduct === -1) colIndexProduct = 2;

            filteredRows = currentDeptData.data.filter(row => {
                const prod = row[colIndexProduct];
                return prod && prod.toString().trim() === productName;
            });
        }

        // Filtrelenmiş veya tüm veri ile raporu çiz
        calculateAndDrawCharts(filteredRows, currentDeptData.columns);
    }





    function calculateStats(rows, headers) {
        // Kolon indekslerini bul
        let colIndexO = headers.findIndex(h => h && h.toString().trim() === 'Analiz Formatına Uygunluk Durumu');
        let colIndexP = headers.findIndex(h => h && h.toString().trim() === 'Analiz İçeriği Olgunluk Durumu');
        let colIndexQ = headers.findIndex(h => h && h.toString().trim() === 'Analiz Neden Uygun Değil');

        let colIndexTestBack = headers.findIndex(h => h && (
            h.toString().trim() === 'Back To Analysis Count for Test' ||
            h.toString().trim() === 'Back to Analysis Count for Test'
        ));

        let colIndexDevBack = headers.findIndex(h => h && (
            h.toString().trim() === 'Back To Analysis Count for Development' ||
            h.toString().trim() === 'Back to Analysis Count for Development'
        ));

        // Yedek indeksler
        if (colIndexO === -1) colIndexO = 14;
        if (colIndexP === -1) colIndexP = 15;
        if (colIndexQ === -1) colIndexQ = 16;
        if (colIndexTestBack === -1) colIndexTestBack = 11;
        if (colIndexDevBack === -1) colIndexDevBack = 12;

        // Analiz değişkenleri
        let analysisO = { uygun: 0, uygunDegil: 0, total: 0, percentage: 0 };
        let analysisP = { uygun: 0, uygunDegil: 0, total: 0, percentage: 0 };
        let analysisQ = {};
        let testBackCount = 0;
        let devBackCount = 0;

        // Veriyi işle
        rows.forEach(row => {
            // O Kolonu
            const valO = (row[colIndexO] || '').toString().trim().toLowerCase();
            if (valO === 'uygun') analysisO.uygun++;
            else if (valO === 'uygun değil') analysisO.uygunDegil++;

            // P Kolonu
            const valP = (row[colIndexP] || '').toString().trim().toLowerCase();
            if (valP === 'uygun') analysisP.uygun++;
            else if (valP === 'uygun değil') analysisP.uygunDegil++;

            // Q Kolonu
            if (valO === 'uygun değil' || valP === 'uygun değil') {
                const valQ = (row[colIndexQ] || '').toString().trim();
                if (valQ && valQ !== '-' && valQ !== '0') {
                    analysisQ[valQ] = (analysisQ[valQ] || 0) + 1;
                }
            }

            // Back counts
            const valTest = parseInt(row[colIndexTestBack]);
            if (!isNaN(valTest)) testBackCount += valTest;

            const valDev = parseInt(row[colIndexDevBack]);
            if (!isNaN(valDev)) devBackCount += valDev;
        });

        // Yüzdeler
        analysisO.total = analysisO.uygun + analysisO.uygunDegil;
        analysisO.percentage = analysisO.total > 0 ? ((analysisO.uygun / analysisO.total) * 100).toFixed(1) : 0;

        analysisP.total = analysisP.uygun + analysisP.uygunDegil;
        analysisP.percentage = analysisP.total > 0 ? ((analysisP.uygun / analysisP.total) * 100).toFixed(1) : 0;

        return { analysisO, analysisP, analysisQ, testBackCount, devBackCount };
    }

    function calculateAndDrawCharts(rows, headers) {
        const stats = calculateStats(rows, headers);
        const { analysisO, analysisP, analysisQ, testBackCount, devBackCount } = stats;

        createPieChart('overview-chart-o', analysisO, true);
        createPieChart('overview-chart-p', analysisP, true);
        createComparisonChart('overview-chart-comparison', analysisO, analysisP, true);
        populateReasonsTable(analysisQ);

        displayStats('overview-stats-o', analysisO);
        displayStats('overview-stats-p', analysisP);

        document.getElementById('overview-test-back-count').textContent = testBackCount;
        document.getElementById('overview-dev-back-count').textContent = devBackCount;
    }



    // --- GRAFİK FONKSİYONLARI ---
    function createPieChart(canvasId, analysis, isSmall) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Uygun', 'Uygun Değil'],
                datasets: [{
                    data: [analysis.uygun, analysis.uygunDegil],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0 // PDF için animasyonu kapat
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 12, family: 'Outfit' },
                            padding: 10
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const val = context.parsed;
                                const total = analysis.total;
                                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                                return ` ${val} (${pct}%)`;
                            }
                        }
                    },
                    datalabels: { display: false }
                }
            }
        });
    }

    function createComparisonChart(canvasId, analysisO, analysisP, isSmall) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Analiz Uygunluğu', 'Analiz Olgunluğu'],
                datasets: [{
                    label: 'Uygunluk Oranı (%)',
                    data: [analysisO.percentage, analysisP.percentage],
                    backgroundColor: ['#10b981', '#10b981'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: v => v + '%' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        color: 'white',
                        font: { weight: 'bold' },
                        formatter: v => v + '%'
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    function populateReasonsTable(reasons) {
        const tbody = document.getElementById('reasons-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        const sorted = Object.entries(reasons).sort((a, b) => b[1] - a[1]);

        if (sorted.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--text-grey);">Uygunsuzluk sebebi bulunamadı</td></tr>';
            return;
        }

        sorted.forEach(([reason, count]) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${reason}</td><td style="text-align:center; font-weight:600; color:var(--thy-red);">${count}</td>`;
            tbody.appendChild(tr);
        });
    }

    function displayStats(elementId, analysis) {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = `
                <strong>Toplam Kayıt:</strong> ${analysis.total}<br>
                <strong>Uygun:</strong> ${analysis.uygun}<br>
                <strong>Uygun Değil:</strong> ${analysis.uygunDegil}<br>
                <strong>Uygunluk Oranı:</strong> %${analysis.percentage}
            `;
        }
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // --- SENIOR-LEVEL PDF ENGINE (jspdf + html2canvas) ---
    async function exportToPDF() {
        if (!currentDeptData) return;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const deptName = document.getElementById('selected-department-name').textContent;
        // Hardcoded Base64 Logo to bypass CORS on local file systems
        const logoSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABICAIAAA...[truncated]...kAAAABJRU5ErkJggg==';
        const renderBin = document.getElementById('pdf-render-bin');

        // High-Quality Scaling for html2canvas
        const captureScale = 2.0;

        // PDF Dimensions (A4 in mm)
        const pdfWidth = 210;
        const pdfHeight = 297;

        try {
            const renderQueue = [];

            // 1. Executive Summary (Page 1)
            const summaryStats = calculateStats(currentDeptData.data, currentDeptData.columns);
            renderQueue.push({ title: 'Yönetici Özeti', stats: summaryStats, id: 'page-summary' });

            // 2. Individual Product Reports
            const productOptions = Array.from(productSelect.options).filter(opt => opt.value !== "");
            const headers = currentDeptData.columns;
            let colIndexProduct = headers.findIndex(h => h && ['ürün', 'urun', 'product', 'proje', 'project'].includes(h.toString().trim().toLowerCase())) || 2;

            for (let i = 0; i < productOptions.length; i++) {
                const product = productOptions[i].value;
                const filteredRows = currentDeptData.data.filter(row => {
                    const prod = row[colIndexProduct];
                    return prod && prod.toString().trim() === product;
                });
                if (filteredRows.length === 0) continue;
                renderQueue.push({
                    title: `Detay Rapor: ${product}`,
                    stats: calculateStats(filteredRows, headers),
                    id: `page-prod-${i}`
                });
            }

            // --- Capture & Generate Loop ---
            for (let i = 0; i < renderQueue.length; i++) {
                const item = renderQueue[i];
                if (i > 0) pdf.addPage();

                // Create render-safe HTML
                renderBin.innerHTML = createPDFPageHtml(item.id, item.title, deptName, logoSrc, item.stats);
                renderPDFCharts(item.id, item.stats);

                // Wait for Chart.js rendering
                await new Promise(r => setTimeout(r, 600));

                // Capture as Canvas
                const canvas = await html2canvas(renderBin, {
                    scale: captureScale,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    width: 1000 // Fixed width for consistency
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const imgProps = pdf.getImageProperties(imgData);

                // Calculate Fit-to-Page scaling
                const renderWidth = pdfWidth;
                const renderHeight = (imgProps.height * renderWidth) / imgProps.width;

                // Fit logic: If content is taller than A4, scale it down to fit perfectly on 1 page
                let finalHeight = renderHeight;
                let finalWidth = renderWidth;
                let xOffset = 0;
                let yOffset = 0;

                if (renderHeight > pdfHeight) {
                    const ratio = pdfHeight / renderHeight;
                    finalHeight = pdfHeight;
                    finalWidth = renderWidth * ratio;
                    xOffset = (pdfWidth - finalWidth) / 2; // Center horizontally
                }

                pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
            }

            pdf.save(`Denetim_Raporu_${deptName.replace(/\s+/g, '_')}.pdf`);

        } catch (err) {
            console.error('PDF Generation Error:', err);
            throw err;
        } finally {
            renderBin.innerHTML = ''; // Cleanup
        }
    }

    async function getBase64ImageFromUrl(imageUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => {
                console.warn('Image loading failed, skipping base64 conversion');
                resolve(imageUrl);
            };
            img.src = imageUrl;
        });
    }

    function createPDFPageHtml(id, title, deptName, logoSrc, stats) {
        const sortedReasons = Object.entries(stats.analysisQ).sort((a, b) => b[1] - a[1]).slice(0, 15);
        let reasonsHtml = '';
        if (sortedReasons.length > 0) {
            reasonsHtml = `
                <div style="margin-top: 20px;">
                    <h3 style="color:#00235D; font-size:16px; border-bottom:1px solid #eee; padding-bottom:5px;">❌ Uygunsuzluk Sebepleri</h3>
                    <table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:12px;">
                        <thead><tr style="background:#f8fafc;"><th style="border:1px solid #e2e8f0; padding:8px; text-align:left;">Sebep</th><th style="border:1px solid #e2e8f0; padding:8px; text-align:center;">Adet</th></tr></thead>
                        <tbody>${sortedReasons.map(([r, c]) => `<tr><td style="border:1px solid #e2e8f0; padding:8px;">${r}</td><td style="border:1px solid #e2e8f0; padding:8px; text-align:center; color:#E81932; font-weight:bold;">${c}</td></tr>`).join('')}</tbody>
                    </table>
                </div>`;
        }

        return `
            <div style="padding: 40px; font-family:'Inter', sans-serif; color:#333; background:white;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #E81932; padding-bottom:20px; margin-bottom:30px;">
                    <div>
                        <h1 style="color:#00235D; margin:0; font-size:24px;">Denetim Raporu</h1>
                        <div style="color:#666; font-size:14px;">${deptName}</div>
                    </div>
                    <img src="${logoSrc}" style="height:50px;">
                </div>
                
                <h2 style="color:#00235D; text-align:center; margin-bottom:30px;">${title}</h2>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:30px;">
                    <div style="border:1px solid #eee; border-radius:12px; padding:20px; text-align:center;">
                        <h4 style="margin:0 0 15px 0; font-size:14px; color:#666;">Analiz Formatına Uygunluk</h4>
                        <div style="height:200px;"><canvas id="chart-o-${id}"></canvas></div>
                        <div style="margin-top:10px; font-weight:bold; color:#00235D;">%${stats.analysisO.percentage} Uygunluk</div>
                    </div>
                    <div style="border:1px solid #eee; border-radius:12px; padding:20px; text-align:center;">
                        <h4 style="margin:0 0 15px 0; font-size:14px; color:#666;">Analiz İçeriği Olgunluk</h4>
                        <div style="height:200px;"><canvas id="chart-p-${id}"></canvas></div>
                        <div style="margin-top:10px; font-weight:bold; color:#00235D;">%${stats.analysisP.percentage} Olgunluk</div>
                    </div>
                </div>

                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:25px; margin-bottom:30px;">
                    <div style="display:flex; justify-content:space-around;">
                        <div style="text-align:center;"><div style="font-size:24px; font-weight:bold; color:#00235D;">${stats.testBackCount}</div><div style="font-size:11px; color:#666;">Testten Dönen</div></div>
                        <div style="text-align:center;"><div style="font-size:24px; font-weight:bold; color:#00235D;">${stats.devBackCount}</div><div style="font-size:11px; color:#666;">Dev'den Dönen</div></div>
                        <div style="text-align:center;"><div style="font-size:24px; font-weight:bold; color:#00235D;">${stats.analysisO.uygunDegil + stats.analysisP.uygunDegil}</div><div style="font-size:11px; color:#666;">Toplam Uygunsuzluk</div></div>
                    </div>
                </div>

                ${reasonsHtml}
                
                <div style="margin-top: auto; padding-top:20px; font-size:10px; color:#999; text-align:center;">
                    AuditX v1.0 | ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.
                </div>
            </div>`;
    }

    function renderPDFCharts(id, stats) {
        const opts = (data, colors) => ({
            type: 'doughnut',
            data: {
                labels: ['Uygun', 'Uygun Değil'],
                datasets: [{ data, backgroundColor: colors, borderWidth: 0 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                plugins: { legend: { display: false }, datalabels: { display: false } }
            }
        });

        new Chart(document.getElementById(`chart-o-${id}`), opts([stats.analysisO.uygun, stats.analysisO.uygunDegil], ['#10b981', '#ef4444']));
        new Chart(document.getElementById(`chart-p-${id}`), opts([stats.analysisP.uygun, stats.analysisP.uygunDegil], ['#10b981', '#ef4444']));
    }
});
