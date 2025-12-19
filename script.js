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
            video: { width: 1280, height: 720 }, 
            audio: false 
        });
        video.srcObject = stream;
    } catch (err) {
        statusEl.innerText = "Kamera tidak aktif.";
    }
}

// 2. Sesi Foto
async function startPhotoSession() {
    photos = [];
    startBtn.disabled = true;
    downloadBtn.disabled = true;
    
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

function takePhoto(index) {
    const context = captureCanvas.getContext('2d');
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    context.translate(captureCanvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    const imageData = captureCanvas.toDataURL('image/png');
    photos.push(imageData);

    const img = document.createElement('img');
    img.src = imageData;
    photoSlots[index].appendChild(img);
    photoSlots[index].classList.add('filled');
}

// 3. Generate Final Result (Perbaikan Posisi Sticker)
function generateFinalCanvas() {
    const ctx = finalCanvas.getContext('2d');
    const imgW = 600;
    const imgH = 450;
    const padding = 70; 
    const gap = 80;    
    
    finalCanvas.width = imgW + (padding * 2);
    finalCanvas.height = (imgH * maxPhotos) + (gap * (maxPhotos - 1)) + 300; 

    // A. Background Stripes (Full)
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

    // B. Judul PicLoop Estetik
    const centerX = finalCanvas.width / 2;
    ctx.font = "bold 85px 'Comic Sans MS', cursive";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700"; ctx.fillText("PicLoop", centerX + 5, 115);
    ctx.fillStyle = "#ff1493"; ctx.fillText("PicLoop", centerX + 10, 120);
    ctx.fillStyle = "white"; ctx.fillText("PicLoop", centerX, 110);

    // C. Data Sticker (Koordinat diatur agar tidak terlalu ke pinggir)
    // x: 0 adalah sisi kiri foto, x: imgW adalah sisi kanan foto
    const stickers = [
        { s1: "⭐", p1: {x: 20, y: 10}, s2: "🌈", p2: {x: imgW - 20, y: imgH - 10} },
        { s1: "💕", p1: {x: imgW - 20, y: 20}, s2: "💖", p2: {x: 30, y: imgH - 10} },
        { s1: "✨", p1: {x: 20, y: imgH - 10}, s2: "🎀", p2: {x: imgW - 20, y: 20} }
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

            // Gambar Foto
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
            // S1
            ctx.fillText(current.s1, padding + current.p1.x, y + current.p1.y);
            // S2
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

startBtn.addEventListener('click', startPhotoSession);
restartBtn.addEventListener('click', () => location.reload());
downloadBtn.addEventListener('click', generateFinalCanvas);

initCamera();