const video = document.getElementById('video');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const downloadBtn = document.getElementById('downloadBtn');
const countdownEl = document.getElementById('countdown');
const statusEl = document.getElementById('status');
const photoSlots = document.querySelectorAll('.photo-slot');
const captureCanvas = document.getElementById('captureCanvas');
const finalCanvas = document.getElementById('finalCanvas');

let photos = [];
const maxPhotos = 3;

// 1. Inisialisasi Kamera
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            // Menggunakan ideal agar browser berusaha memberikan rasio terbaik
            video: { width: { ideal: 1280 }, height: { ideal: 960 } }, 
            audio: false 
        });
        video.srcObject = stream;
    } catch (err) {
        statusEl.innerText = "Kamera tidak aktif atau izin ditolak.";
    }
}

// 2. Sesi Foto
async function startPhotoSession() {
    photos = [];
    startBtn.disabled = true;
    downloadBtn.disabled = true;
    
    // Reset Grid
    photoSlots.forEach(slot => {
        slot.classList.remove('filled');
        const img = slot.querySelector('img');
        if (img) img.remove();
    });

    for (let i = 0; i < maxPhotos; i++) {
        statusEl.innerText = `Siap foto ke-${i + 1}`;
        for (let count = 3; count > 0; count--) {
            countdownEl.innerText = count;
            await new Promise(r => setTimeout(r, 1000));
        }
        countdownEl.innerText = "📸";
        takePhoto(i);
        await new Promise(r => setTimeout(r, 800));
    }

    countdownEl.innerText = "";
    statusEl.innerText = "Selesai! Klik Download.";
    startBtn.disabled = false;
    downloadBtn.disabled = false;
}

// 3. Ambil Foto dengan Logika Anti-Gepeng (Crop Tengah)
function takePhoto(index) {
    const context = captureCanvas.getContext('2d');
    
    // Tentukan ukuran target (Rasio 4:3)
    const targetWidth = 800;
    const targetHeight = 600;
    captureCanvas.width = targetWidth;
    captureCanvas.height = targetHeight;

    const videoW = video.videoWidth;
    const videoH = video.videoHeight;
    const targetAspect = targetWidth / targetHeight;
    const videoAspect = videoW / videoH;

    let sourceX = 0, sourceY = 0, sourceW = videoW, sourceH = videoH;

    // Logika CROP: Jika video lebih lebar dari 4:3, potong samping. Jika lebih tinggi, potong atas bawah.
    if (videoAspect > targetAspect) {
        sourceW = videoH * targetAspect;
        sourceX = (videoW - sourceW) / 2;
    } else {
        sourceH = videoW / targetAspect;
        sourceY = (videoH - sourceH) / 2;
    }

    context.save();
    // Efek Mirror agar hasil download searah dengan preview kamera
    context.translate(targetWidth, 0);
    context.scale(-1, 1);
    
    // DrawImage dengan cropping: (image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    context.drawImage(video, sourceX, sourceY, sourceW, sourceH, 0, 0, targetWidth, targetHeight);
    context.restore();

    const imageData = captureCanvas.toDataURL('image/png');
    photos.push(imageData);

    // Tampilkan di grid preview
    const img = document.createElement('img');
    img.src = imageData;
    photoSlots[index].appendChild(img);
    photoSlots[index].classList.add('filled');
}

// 4. Generate Final Result (Sticker & Background)
function generateFinalCanvas() {
    const ctx = finalCanvas.getContext('2d');
    const imgW = 600; // Lebar foto di hasil download
    const imgH = 450; // Tinggi foto di hasil download
    const padding = 70; 
    const gap = 80;    
    
    finalCanvas.width = imgW + (padding * 2);
    finalCanvas.height = (imgH * maxPhotos) + (gap * (maxPhotos - 1)) + 300; 

    // A. Background Stripes
    ctx.fillStyle = "#ff6b9d";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    
    ctx.save();
    ctx.translate(finalCanvas.width / 2, finalCanvas.height / 2);
    ctx.rotate(45 * Math.PI / 180);
    ctx.fillStyle = "#ff8bb5";
    const area = Math.max(finalCanvas.width, finalCanvas.height) * 2;
    for (let i = -area; i < area; i += 50) {
        ctx.fillRect(i, -area, 25, area * 2);
    }
    ctx.restore();

    // B. Judul PicLoop 3D Look
    const centerX = finalCanvas.width / 2;
    ctx.font = "bold 85px 'Comic Sans MS', cursive";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700"; ctx.fillText("PicLoop", centerX + 5, 115);
    ctx.fillStyle = "#ff1493"; ctx.fillText("PicLoop", centerX + 10, 120);
    ctx.fillStyle = "white"; ctx.fillText("PicLoop", centerX, 110);

    // C. Pengaturan Sticker (Koordinat di dalam area foto)
    const stickers = [
        { s1: "⭐", p1: {x: 40, y: 40}, s2: "🌈", p2: {x: imgW - 40, y: imgH - 40} },
        { s1: "💕", p1: {x: imgW - 40, y: 40}, s2: "💖", p2: {x: 40, y: imgH - 40} },
        { s1: "✨", p1: {x: 40, y: imgH - 40}, s2: "🎀", p2: {x: imgW - 40, y: 40} }
    ];

    let loaded = 0;
    photos.forEach((src, i) => {
        const img = new Image();
        img.onload = () => {
            const y = 200 + (i * (imgH + gap));
            
            // Frame Putih
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.roundRect(padding - 15, y - 15, imgW + 30, imgH + 30, 20);
            ctx.fill();

            // Foto
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(padding, y, imgW, imgH, 15);
            ctx.clip();
            ctx.drawImage(img, padding, y, imgW, imgH);
            ctx.restore();

            // Gambar Sticker
            ctx.font = "90px serif";
            ctx.textAlign = "center"; 
            ctx.textBaseline = "middle";
            
            const current = stickers[i];
            ctx.fillText(current.s1, padding + current.p1.x, y + current.p1.y);
            ctx.fillText(current.s2, padding + current.p2.x, y + current.p2.y);

            loaded++;
            if(loaded === maxPhotos) {
                const link = document.createElement('a');
                link.download = `PicLoop-${Date.now()}.png`;
                link.href = finalCanvas.toDataURL('image/png');
                link.click();
            }
        };
        img.src = src;
    });
}

// Event Listeners
startBtn.addEventListener('click', startPhotoSession);
restartBtn.addEventListener('click', () => location.reload());
downloadBtn.addEventListener('click', generateFinalCanvas);

// Jalankan Kamera
initCamera();