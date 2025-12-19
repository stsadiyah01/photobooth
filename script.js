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
            video: { width: { ideal: 1280 }, height: { ideal: 960 } }, 
            audio: false 
        });
        video.srcObject = stream;
    } catch (err) {
        statusEl.innerText = "Kamera tidak aktif.";
    }
}

// 2. Sesi Foto Otomatis
async function startPhotoSession() {
    photos = [];
    startBtn.disabled = true;
    downloadBtn.disabled = true;
    
    photoSlots.forEach(slot => {
        slot.innerHTML = '';
        slot.classList.remove('filled');
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

// 3. Ambil Foto (Anti-Gepeng)
function takePhoto(index) {
    const context = captureCanvas.getContext('2d');
    const targetW = 800;
    const targetH = 600;
    captureCanvas.width = targetW;
    captureCanvas.height = targetH;

    const vW = video.videoWidth;
    const vH = video.videoHeight;
    const tAspect = targetW / targetH;
    const vAspect = vW / vH;

    let sx, sy, sW, sH;
    if (vAspect > tAspect) {
        sW = vH * tAspect; sH = vH;
        sx = (vW - sW) / 2; sy = 0;
    } else {
        sW = vW; sH = vW / tAspect;
        sx = 0; sy = (vH - sH) / 2;
    }

    context.save();
    context.translate(targetW, 0);
    context.scale(-1, 1); // Mirror
    context.drawImage(video, sx, sy, sW, sH, 0, 0, targetW, targetH);
    context.restore();

    const imageData = captureCanvas.toDataURL('image/png');
    photos.push(imageData);

    const img = document.createElement('img');
    img.src = imageData;
    photoSlots[index].appendChild(img);
    photoSlots[index].classList.add('filled');
}

// 4. Fungsi Logo PicLoop (Persis gaya CSS h1)
function drawLogoPicLoop(ctx, x, y, fontSize) {
    const text = "PicLoop";
    ctx.font = `bold ${fontSize}px 'Bangers', cursive`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Layer 1: Shadow Jauh (Pink Tua)
    ctx.fillStyle = "rgba(214, 51, 132, 0.5)";
    ctx.fillText(text, x + 8, y + 8);

    // Layer 2: Outline Kuning
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 12;
    ctx.strokeText(text, x + 5, y + 5);

    // Layer 3: Outline Putih Tebal
    ctx.strokeStyle = "white";
    ctx.lineWidth = 18;
    ctx.lineJoin = "round";
    ctx.strokeText(text, x, y);

    // Layer 4: Teks Utama Pink
    ctx.fillStyle = "#ff1493";
    ctx.fillText(text, x, y);
}

// 5. Fungsi Stiker Emoji (Samain gaya Drop-Shadow CSS)
function drawStickerEmoji(ctx, emoji, x, y, size) {
    ctx.font = `${size}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Simulasi filter: drop-shadow(2px 2px 0 white) drop-shadow(-2px -2px 0 white)
    ctx.strokeStyle = "white";
    ctx.lineWidth = 12; // Tebal outline putih
    ctx.lineJoin = "round";
    ctx.strokeText(emoji, x, y);

    // Shadow Hitam Lembut (paling bawah)
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    // Gambar Emoji Utama
    ctx.fillText(emoji, x, y);

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

// 6. Logika Download Strip Foto
function generateFinalCanvas() {
    const ctx = finalCanvas.getContext('2d');
    const imgW = 600;
    const imgH = 450;
    const padding = 80; 
    const gap = 60;    
    
    finalCanvas.width = imgW + (padding * 2);
    finalCanvas.height = 220 + (imgH * maxPhotos) + (gap * (maxPhotos - 1)) + 100; 

    // A. Background Stripes (Samain persis sama CSS photo-grid)
    ctx.fillStyle = "#ff6b9d";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    
    ctx.save();
    ctx.translate(finalCanvas.width / 2, finalCanvas.height / 2);
    ctx.rotate(45 * Math.PI / 180);
    ctx.fillStyle = "#ff8bb5";
    const stripeArea = Math.max(finalCanvas.width, finalCanvas.height) * 2;
    for (let i = -stripeArea; i < stripeArea; i += 40) { // Gap 40px sesuai CSS
        ctx.fillRect(i, -stripeArea, 20, stripeArea * 2); // Lebar 20px
    }
    ctx.restore();

    // B. Header Logo
    drawLogoPicLoop(ctx, finalCanvas.width / 2, 110, 110);

    // C. Data Stiker - KOORDINAT YANG TEPAT (overlap dengan border foto)
    const stickerData = [
        // Foto 1: Bintang di pojok kiri atas (overlap)
        { 
            stickers: [
                { emoji: "⭐", x: padding - 20, y: -20, size: 100 }
            ]
        },
        // Foto 2: Hati kanan atas, Sparkle+Bintang kiri bawah, Rainbow kanan bawah
        { 
            stickers: [
                { emoji: "💕", x: imgW + padding + 15, y: -15, size: 85 },
                { emoji: "💖", x: imgW + padding + 35, y: 5, size: 70 },
                { emoji: "✨", x: padding - 30, y: imgH + 10, size: 65 },
                { emoji: "⭐", x: padding - 5, y: imgH + 30, size: 80 },
                { emoji: "🌈", x: imgW + padding + 10, y: imgH + 5, size: 95 }
            ]
        },
        // Foto 3: Bintang+Sparkle kiri atas, Pita kanan atas, Rainbow kanan bawah  
        { 
            stickers: [
                { emoji: "⭐", x: padding - 25, y: -25, size: 90 },
                { emoji: "✨", x: padding + 5, y: -5, size: 65 },
                { emoji: "🎀", x: imgW + padding + 15, y: -15, size: 85 },
                { emoji: "🌈", x: imgW + padding + 10, y: imgH + 5, size: 95 }
            ]
        }
    ];

    let loaded = 0;
    photos.forEach((src, i) => {
        const img = new Image();
        img.onload = () => {
            const y = 230 + (i * (imgH + gap));
            
            // Bingkai Strip Putih (Border 8px solid white di CSS)
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.roundRect(padding - 20, y - 20, imgW + 40, imgH + 40, 25);
            ctx.fill();

            // Foto Rounded
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(padding, y, imgW, imgH, 20);
            ctx.clip();
            ctx.drawImage(img, padding, y, imgW, imgH);
            ctx.restore();

            // Gambar Emoji Stiker sesuai data (sticker.y sudah absolut dari y foto)
            const currentStickers = stickerData[i];
            currentStickers.stickers.forEach(sticker => {
                const absoluteY = y + sticker.y;
                drawStickerEmoji(ctx, sticker.emoji, sticker.x, absoluteY, sticker.size);
            });

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

// Listeners
startBtn.addEventListener('click', startPhotoSession);
restartBtn.addEventListener('click', () => location.reload());
downloadBtn.addEventListener('click', generateFinalCanvas);

initCamera();