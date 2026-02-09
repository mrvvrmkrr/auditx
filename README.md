# AuditX - Analiz Denetim ve Raporlama Sistemi

AuditX, Excel formatındaki denetim verilerini analiz eden ve görselleştiren modern bir web uygulamasıdır.

## 🚀 Özellikler

- **Veri Analizi:** Excel (.xlsx, .xls) ve CSV dosyalarından otomatik veri çekme.
- **Dinamik Dashboard:** Müdürlük ve ürün bazlı filtreleme seçenekleri.
- **Görselleştirme:**
    - Analiz Formatına Uygunluk (Pie Chart)
    - Analiz İçeriği Olgunluk (Pie Chart)
    - Karşılaştırmalı Analiz (Bar Chart)
- **Hata Analizi:** Uygunsuzluk sebeplerinin sayısal dökümü ve metriklendirilmesi.

## 🛠️ Kullanılan Teknolojiler

- **Frontend:** HTML5, Modern CSS (Vanilla), JavaScript (ES6+)
- **Grafikler:** [Chart.js](https://www.chartjs.org/) & [chartjs-plugin-datalabels](https://chartjs-plugin-datalabels.netlify.app/)
- **Veri İşleme:** [SheetJS (XLSX)](https://sheetjs.com/)

## 📦 Kurulum ve Çalıştırma

Uygulama herhangi bir sunucu taraflı bağımlılığa ihtiyaç duymaz (Client-side). 

1. Proje dosyalarını bilgisayarınıza indirin.
2. `index.html` dosyasını modern bir tarayıcıda (Chrome, Edge vb.) açın.
3. Kütüphaneler CDN üzerinden yüklendiği için aktif bir internet bağlantısı gereklidir.

## 📖 Kullanım Kılavuzu

1. **Dosya Yükleme:** Ana sayfadaki sürükle-bırak alanını veya "Dosya Seç" butonunu kullanarak denetim Excel'inizi yükleyin.
2. **Müdürlük Seçimi:** Analizini yapmak istediğiniz müdürlüğü listeden seçin ve "Rapor Oluştur" butonuna basın.
3. **Özet İnceleme:** Oluşturulan dashboard üzerinden grafiklere ve metriklere göz atın. Ürün bazlı filtreleme ile detaylara inin.

## 📝 Notlar

- Excel dosyanızın sütun başlıklarının (Müdürlük, Ürün, Analiz Uygunluğu vb.) standart formatta olduğundan emin olun.

---
*Developed with ❤️ for Audit Excellence.*
