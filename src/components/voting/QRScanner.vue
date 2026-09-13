<template>
  <div class="qr-scanner-wrapper text-center">
    <!-- Camera Viewport Box -->
    <div class="position-relative mx-auto bg-dark rounded-4 overflow-hidden shadow" style="max-width: 480px; min-height: 320px;">
      <div id="qr-reader" class="w-100 h-100" style="min-height: 320px;"></div>

      <!-- Scanning overlay frame -->
      <div v-if="isScanning" class="scanner-overlay position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center pointer-events-none">
        <div class="scan-target-box border border-3 border-light rounded-3 position-relative" style="width: 220px; height: 220px;">
          <div class="laser-line"></div>
        </div>
        <p class="text-white small fw-bold bg-dark bg-opacity-75 px-3 py-1 rounded-pill mt-3 mb-0">
          Arahkan QR Code ke dalam kotak
        </p>
      </div>

      <!-- Camera Loading or Error State -->
      <div v-if="loadingCamera" class="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark text-white p-4">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        <p class="mb-0 fw-medium">Menginisialisasi kamera laptop/webcam...</p>
      </div>

      <div v-if="cameraError" class="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark text-white p-4">
        <i class="bi bi-camera-video-off fs-1 text-warning mb-2"></i>
        <h6 class="fw-bold text-white mb-2">Kamera Tidak Dapat Digunakan</h6>
        <p class="small text-white-50 mb-3 px-3">{{ cameraError }}</p>
        <button class="btn btn-sm btn-outline-light rounded-pill px-3" @click="startScanner">
          <i class="bi bi-arrow-clockwise me-1"></i> Coba Lagi
        </button>
      </div>
    </div>

    <!-- Scanner Control Bar -->
    <div class="mt-3 d-flex justify-content-center align-items-center gap-2 flex-wrap">
      <button
        v-if="cameras.length > 1"
        class="btn btn-sm btn-outline-secondary rounded-pill px-3"
        @click="switchCamera"
      >
        <i class="bi bi-arrow-repeat me-1"></i> Ganti Kamera ({{ currentCameraIndex + 1 }}/{{ cameras.length }})
      </button>

      <button
        v-if="isScanning"
        class="btn btn-sm btn-outline-danger rounded-pill px-3"
        @click="stopScanner"
      >
        <i class="bi bi-stop-circle me-1"></i> Hentikan Kamera
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Html5Qrcode } from 'html5-qrcode';

const emit = defineEmits(['scan-success', 'scan-error']);

const isScanning = ref(false);
const loadingCamera = ref(true);
const cameraError = ref(null);
const cameras = ref([]);
const currentCameraIndex = ref(0);
let html5QrCode = null;

async function initScanner() {
  loadingCamera.value = true;
  cameraError.value = null;

  try {
    const devices = await Html5Qrcode.getCameras();
    if (devices && devices.length > 0) {
      cameras.value = devices;
      await startScannerWithDevice(devices[currentCameraIndex.value].id);
    } else {
      cameraError.value = 'Tidak ada perangkat kamera yang terdeteksi pada laptop/komputer ini.';
    }
  } catch (err) {
    console.error('Camera access error:', err);
    cameraError.value = 'Izin kamera ditolak atau kamera sedang digunakan oleh aplikasi lain.';
    emit('scan-error', cameraError.value);
  } finally {
    loadingCamera.value = false;
  }
}

async function startScannerWithDevice(cameraId) {
  try {
    if (html5QrCode && html5QrCode.isScanning) {
      await html5QrCode.stop();
    }

    html5QrCode = new Html5Qrcode('qr-reader');

    const config = {
      fps: 10,
      qrbox: { width: 220, height: 220 },
      aspectRatio: 1.0,
    };

    await html5QrCode.start(
      cameraId,
      config,
      (decodedText) => {
        // Success callback
        handleDecodedText(decodedText);
      },
      () => {
        // scan failure frame (normal when searching)
      }
    );

    isScanning.value = true;
    cameraError.value = null;
  } catch (err) {
    console.error('Failed to start scanner with camera:', err);
    cameraError.value = 'Gagal mengakses kamera. Silakan periksa izin browser.';
    emit('scan-error', cameraError.value);
  }
}

function handleDecodedText(text) {
  if (!text) return;
  const clean = text.trim().toUpperCase();
  emit('scan-success', clean);
}

async function switchCamera() {
  if (cameras.value.length <= 1) return;
  currentCameraIndex.value = (currentCameraIndex.value + 1) % cameras.value.length;
  await startScannerWithDevice(cameras.value[currentCameraIndex.value].id);
}

async function stopScanner() {
  if (html5QrCode && isScanning.value) {
    try {
      await html5QrCode.stop();
      isScanning.value = false;
    } catch (err) {
      console.warn('Error stopping scanner:', err);
    }
  }
}

async function startScanner() {
  await initScanner();
}

onMounted(() => {
  initScanner();
});

onBeforeUnmount(async () => {
  await stopScanner();
});
</script>

<style scoped>
.scanner-overlay {
  background: rgba(0, 0, 0, 0.25);
}

.scan-target-box {
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
}

.laser-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #10b981;
  box-shadow: 0 0 10px #10b981;
  animation: scanLaser 2s infinite alternate ease-in-out;
}

@keyframes scanLaser {
  0% {
    top: 5%;
  }
  100% {
    top: 95%;
  }
}
</style>
