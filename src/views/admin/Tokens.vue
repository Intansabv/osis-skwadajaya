<template>
  <div class="admin-tokens">
    <!-- Konten Dashboard Manajemen Token (Hanya tampil di layar monitor, tidak ikut tercetak) -->
    <div class="token-management-dashboard no-print">
      <!-- Header & Actions -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <h3 class="fw-extrabold text-dark mb-1">Manajemen Token Voting</h3>
        <p class="text-muted mb-0">
          Generate dan kelola token autentikasi 6-karakter unik beserta QR Code pemilih
        </p>
      </div>

      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-outline-primary rounded-pill px-3" @click="showBatchModal = true">
          <i class="bi bi-stack me-1"></i> Generate Massal
        </button>
        <button class="btn btn-primary rounded-pill px-3 shadow-sm" @click="showSingleModal = true">
          <i class="bi bi-plus-lg me-1"></i> Buat Token Baru
        </button>
        <button class="btn btn-outline-dark rounded-pill px-3" @click="openPrintCardsModal">
          <i class="bi bi-printer me-1"></i> Cetak Kartu Token QR
        </button>
        <button
          class="btn btn-outline-danger rounded-pill px-3"
          :disabled="tokens.length === 0"
          @click="showClearModal = true"
        >
          <i class="bi bi-trash3 me-1"></i> Hapus / Bersihkan Token
        </button>
      </div>
    </div>

    <!-- Alert Message -->
    <AlertMessage
      v-if="alertMessage"
      :message="alertMessage"
      :type="alertType"
      dismissible
      @close="alertMessage = null"
    />

    <!-- Filter & Stat Bar -->
    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-md-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
          <span class="text-muted small fw-bold">TOTAL TOKEN</span>
          <h3 class="fw-bold text-dark mb-0">{{ tokens.length }}</h3>
        </div>
      </div>
      <div class="col-sm-6 col-md-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
          <span class="text-muted small fw-bold text-success">BELUM DIGUNAKAN</span>
          <h3 class="fw-bold text-success mb-0">{{ unusedCount }}</h3>
        </div>
      </div>
      <div class="col-sm-6 col-md-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
          <span class="text-muted small fw-bold text-primary">SUDAH DIGUNAKAN</span>
          <h3 class="fw-bold text-primary mb-0">{{ usedCount }}</h3>
        </div>
      </div>
      <div class="col-sm-6 col-md-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
          <span class="text-muted small fw-bold text-secondary">NONAKTIF</span>
          <h3 class="fw-bold text-secondary mb-0">{{ inactiveCount }}</h3>
        </div>
      </div>
    </div>

    <!-- Tokens Table Card -->
    <div class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
      <div class="card-header bg-white border-0 p-3 p-md-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div class="d-flex align-items-center gap-2">
          <input
            v-model="search"
            type="text"
            class="form-control form-control-sm rounded-pill px-3"
            placeholder="Cari token..."
            style="max-width: 220px;"
          />
          <select v-model="filterStatus" class="form-select form-select-sm rounded-pill" style="width: 160px;">
            <option value="all">Semua Status</option>
            <option value="active">Belum Digunakan</option>
            <option value="used">Sudah Digunakan</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        <span class="text-muted small">
          Menampilkan {{ filteredTokens.length }} token
        </span>
      </div>

      <!-- Selection Action Bar -->
      <div
        v-if="selectedTokenIds.length > 0"
        class="bg-warning bg-opacity-10 border-top border-bottom border-warning border-opacity-25 px-3 px-md-4 py-2 d-flex justify-content-between align-items-center flex-wrap gap-2"
      >
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-warning text-dark px-2 py-1 rounded-pill fw-bold">
            {{ selectedTokenIds.length }} Token Terpilih
          </span>
          <span class="small text-muted">dari total {{ filteredTokens.length }} token yang ditampilkan</span>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button
            type="button"
            class="btn btn-sm btn-dark rounded-pill px-3 fw-semibold"
            @click="openPrintSelectedCards"
          >
            <i class="bi bi-printer me-1"></i> Cetak Terpilih ({{ selectedTokenIds.length }})
          </button>
          <button
            type="button"
            class="btn btn-sm btn-danger rounded-pill px-3 fw-semibold"
            @click="promptDeleteSelected"
          >
            <i class="bi bi-trash3-fill me-1"></i> Hapus Terpilih ({{ selectedTokenIds.length }})
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary rounded-pill px-3"
            @click="selectedTokenIds = []"
          >
            Batal
          </button>
        </div>
      </div>

      <LoadingSpinner v-if="loading" text="Memuat token..." />

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light table-light small text-uppercase text-muted">
            <tr>
              <th class="ps-3" style="width: 42px;">
                <input
                  type="checkbox"
                  class="form-check-input"
                  :checked="isAllSelected"
                  :indeterminate.prop="isIndeterminate"
                  :disabled="filteredTokens.length === 0"
                  title="Pilih Semua Token Ditampilkan"
                  @change="toggleSelectAll"
                />
              </th>
              <th style="width: 45px;">No</th>
              <th>Token (6 Karakter)</th>
              <th>QR Code</th>
              <th>Status</th>
              <th>Waktu Digunakan</th>
              <th>Dibuat Pada</th>
              <th class="text-end pe-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredTokens.length === 0">
              <td colspan="8" class="text-center py-5 text-muted">
                Tidak ada data token yang cocok.
              </td>
            </tr>

            <tr
              v-for="(tok, idx) in filteredTokens"
              :key="tok.id"
              :class="{ 'table-active': selectedTokenIds.includes(tok.id) }"
            >
              <td class="ps-3">
                <input
                  v-model="selectedTokenIds"
                  type="checkbox"
                  class="form-check-input"
                  :value="tok.id"
                />
              </td>
              <td class="text-muted small">{{ idx + 1 }}</td>
              <td>
                <span class="font-monospace fw-bold fs-6 text-primary bg-primary bg-opacity-10 px-2 py-1 rounded">
                  {{ tok.token }}
                </span>
                <span v-if="tok.voter_code" class="badge bg-light text-muted border ms-2 small">
                  {{ tok.voter_code }}
                </span>
              </td>
              <td>
                <button
                  type="button"
                  class="btn btn-sm btn-light border rounded-pill px-2 py-1"
                  @click="previewQR(tok.token)"
                >
                  <i class="bi bi-qr-code me-1"></i> Lihat QR
                </button>
              </td>
              <td>
                <span v-if="tok.status === 'used' || tok.used_at" class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill">
                  Sudah Digunakan
                </span>
                <span v-else-if="tok.status === 'active'" class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill">
                  Belum Digunakan
                </span>
                <span v-else class="badge bg-secondary px-2 py-1 rounded-pill">
                  Nonaktif
                </span>
              </td>
              <td class="text-muted small">
                {{ tok.used_at ? formatDateTime(tok.used_at) : '-' }}
              </td>
              <td class="text-muted small">
                {{ formatDateTime(tok.created_at) }}
              </td>
              <td class="text-end pe-4">
                <div class="btn-group btn-group-sm">
                  <button
                    v-if="tok.status !== 'used'"
                    type="button"
                    :class="['btn', tok.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success']"
                    :title="tok.status === 'active' ? 'Nonaktifkan Token' : 'Aktifkan Token'"
                    @click="toggleStatus(tok)"
                  >
                    <i :class="['bi', tok.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle']"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-danger"
                    title="Hapus Token Ini (Satu-per-Satu)"
                    @click="confirmDelete(tok)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    </div>

    <!-- Modal: Generate Single Token (no-print) -->
    <div v-if="showSingleModal" class="modal fade show d-block no-print" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-header border-0 pb-0">
            <h5 class="fw-bold text-dark">Buat Token Baru</h5>
            <button type="button" class="btn-close" @click="showSingleModal = false"></button>
          </div>
          <div class="modal-body py-4">
            <div class="mb-3">
              <label class="form-label text-muted small fw-semibold">Kode Token (6 Karakter):</label>
              <div class="input-group">
                <input
                  v-model="manualToken"
                  type="text"
                  class="form-control font-monospace fw-bold text-center fs-4 text-primary"
                  maxlength="6"
                  placeholder="Contoh: A7K2P9"
                  style="letter-spacing: 4px; text-transform: uppercase;"
                />
                <button class="btn btn-outline-secondary" type="button" @click="randomizeSingleToken">
                  <i class="bi bi-shuffle me-1"></i> Acak
                </button>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label text-muted small fw-semibold">Kode / Nama Pemilih (Opsional):</label>
              <input
                v-model="manualVoterCode"
                type="text"
                class="form-control"
                placeholder="Contoh: VOT-015 atau Inisial"
              />
            </div>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-light rounded-pill px-3" @click="showSingleModal = false">Batal</button>
            <button
              type="button"
              class="btn btn-primary rounded-pill px-4 fw-bold"
              :disabled="manualToken.length !== 6 || isSaving"
              @click="saveSingleToken"
            >
              Simpan Token
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Generate Multiple Tokens (Batch) (no-print) -->
    <div v-if="showBatchModal" class="modal fade show d-block no-print" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-header border-0 pb-0">
            <h5 class="fw-bold text-dark">Generate Token Massal</h5>
            <button type="button" class="btn-close" @click="showBatchModal = false"></button>
          </div>
          <div class="modal-body py-4">
            <p class="text-muted small mb-3">
              Sistem akan menghasilkan token unik 6-karakter acak secara otomatis menggunakan <em>Cryptographically Secure Random</em>.
            </p>

            <div class="mb-3">
              <label class="form-label text-muted small fw-semibold">Jumlah Token yang Akan Dibuat:</label>
              <div class="d-flex gap-2 mb-2">
                <button
                  v-for="amt in [10, 25, 50, 100]"
                  :key="amt"
                  type="button"
                  :class="['btn', 'btn-sm', batchCount === amt ? 'btn-primary' : 'btn-outline-secondary', 'rounded-pill', 'px-3']"
                  @click="batchCount = amt"
                >
                  {{ amt }} Token
                </button>
              </div>
              <input
                v-model.number="batchCount"
                type="number"
                min="1"
                max="500"
                class="form-control"
                placeholder="Jumlah token kustom..."
              />
            </div>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-light rounded-pill px-3" @click="showBatchModal = false">Batal</button>
            <button
              type="button"
              class="btn btn-primary rounded-pill px-4 fw-bold"
              :disabled="batchCount < 1 || isSaving"
              @click="generateBatch"
            >
              <span v-if="isSaving" class="spinner-border spinner-border-sm me-1"></span>
              Generate {{ batchCount }} Token
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Preview Single QR Code (no-print) -->
    <div v-if="previewQRData" class="modal fade show d-block no-print" tabindex="-1" style="background: rgba(0,0,0,0.6);" @click.self="previewQRData = null">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content rounded-4 border-0 shadow text-center p-3">
          <div class="modal-header border-0 pb-0">
            <h6 class="fw-bold text-dark mb-0">Kartu QR Token</h6>
            <button type="button" class="btn-close" @click="previewQRData = null"></button>
          </div>
          <div class="modal-body py-3">
            <div class="p-2 border rounded-3 bg-white d-inline-block mb-3 shadow-xs">
              <img :src="previewQRData.qrUrl" alt="QR Code" style="width: 180px; height: 180px;" />
            </div>
            <h4 class="font-monospace fw-extrabold text-primary mb-1">{{ previewQRData.token }}</h4>
            <span class="badge bg-light text-muted border">Token 6-Karakter</span>
          </div>
          <div class="modal-footer border-0 pt-0 justify-content-center">
            <button class="btn btn-sm btn-outline-secondary rounded-pill px-4" @click="previewQRData = null">Tutup</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Printable Token Cards Sheet (A4 Portrait - 3x4 Grid = 12 Kartu per Lembar) -->
    <div v-if="showPrintCardsModal" class="modal fade show d-block print-cards-modal-wrapper" tabindex="-1" style="background: rgba(0,0,0,0.65);" @click.self="showPrintCardsModal = false">
      <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
        <div class="modal-content rounded-4 border-0 shadow">
          <!-- Modal Header (no-print) -->
          <div class="modal-header border-bottom pb-3 no-print bg-light rounded-top-4">
            <div>
              <h5 class="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <i class="bi bi-printer text-primary"></i> Cetak Kartu QR Token Siswa
              </h5>
              <p class="text-muted small mb-0">
                Format Standar: <strong>Kertas A4 Portrait (Tegak)</strong> — <strong>3 Kolom x 4 Baris (Pas 12 Kartu per Lembar)</strong>
              </p>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button
                class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                :disabled="isGeneratingPrintCards || printCardsList.length === 0"
                @click="triggerPrint"
              >
                <i class="bi bi-printer-fill fs-5"></i>
                <span>Cetak / Simpan PDF ({{ printPages.length }} Lembar A4)</span>
              </button>
              <button type="button" class="btn-close ms-2" @click="showPrintCardsModal = false"></button>
            </div>
          </div>

          <!-- Modal Body (Printable Area) -->
          <div class="modal-body p-3 p-md-4 printable-area">
            <!-- Filter & Setting Toolbar (no-print) -->
            <div class="no-print bg-light border rounded-3 p-3 mb-4">
              <div class="row g-3 align-items-center">
                <!-- Filter Sumber Token -->
                <div class="col-lg-5 col-md-6">
                  <label class="form-label small fw-bold text-secondary mb-1">
                    <i class="bi bi-filter me-1"></i>Pilih Sumber Token:
                  </label>
                  <div class="btn-group w-100" role="group">
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="printSourceFilter === 'active' ? 'btn-primary fw-semibold' : 'btn-outline-secondary'"
                      @click="changePrintFilter('active')"
                    >
                      Token Aktif ({{ unusedCount }})
                    </button>
                    <button
                      v-if="selectedTokenIds.length > 0"
                      type="button"
                      class="btn btn-sm"
                      :class="printSourceFilter === 'selected' ? 'btn-primary fw-semibold' : 'btn-outline-secondary'"
                      @click="changePrintFilter('selected')"
                    >
                      Terpilih ({{ selectedTokenIds.length }})
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="printSourceFilter === 'all' ? 'btn-primary fw-semibold' : 'btn-outline-secondary'"
                      @click="changePrintFilter('all')"
                    >
                      Semua ({{ tokens.length }})
                    </button>
                  </div>
                </div>

                <!-- Limit Cetak -->
                <div class="col-lg-4 col-md-6">
                  <label class="form-label small fw-bold text-secondary mb-1">
                    <i class="bi bi-layers me-1"></i>Batas Jumlah Token:
                  </label>
                  <select
                    class="form-select form-select-sm rounded-pill"
                    v-model="printMaxLimit"
                    @change="reloadPrintCards"
                  >
                    <option :value="36">36 Token (3 Lembar A4)</option>
                    <option :value="60">60 Token (5 Lembar A4)</option>
                    <option :value="120">120 Token (10 Lembar A4)</option>
                    <option :value="240">240 Token (20 Lembar A4)</option>
                    <option :value="600">600 Token (50 Lembar A4)</option>
                    <option :value="99999">Semua Token (Tanpa Batas)</option>
                  </select>
                </div>

                <!-- Status Summary -->
                <div class="col-lg-3 col-md-12 text-lg-end">
                  <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill fw-bold d-inline-flex align-items-center gap-1">
                    <i class="bi bi-check-circle-fill"></i>
                    {{ printCardsList.length }} Token • {{ printPages.length }} Lembar A4
                  </span>
                </div>
              </div>

              <!-- Petunjuk Print Browser -->
              <div class="alert alert-info border-0 rounded-3 p-2 px-3 mt-3 mb-0 small d-flex align-items-center gap-2">
                <i class="bi bi-info-circle-fill text-info fs-5 flex-shrink-0"></i>
                <div class="text-secondary">
                  <strong>Tips Cetak Printer:</strong> Format sudah otomatis presisi <strong>A4 Portrait (3 Kolom x 4 Baris = Tepat 12 Kartu per Lembar)</strong>. Pada jendela print browser, disarankan hilangkan centang <em>"Headers and footers"</em> agar tidak ada tulisan URL/tanggal di pinggir kertas.
                </div>
              </div>
            </div>

            <!-- Loading Spinner saat generate QR -->
            <div v-if="isGeneratingPrintCards" class="text-center py-5 no-print">
              <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
              <p class="text-muted mt-3 fw-semibold">Sedang merender {{ printCardsList.length || 'kartu' }} QR Code...</p>
            </div>

            <!-- Empty State jika tidak ada token -->
            <div v-else-if="printCardsList.length === 0" class="text-center py-5 no-print">
              <i class="bi bi-ticket-perforated fs-1 text-muted"></i>
              <h6 class="fw-bold text-dark mt-2">Tidak Ada Token untuk Dicetak</h6>
              <p class="text-muted small">Coba ubah filter di atas atau generate token baru terlebih dahulu.</p>
            </div>

            <!-- Lembar A4 Multi-Page Container -->
            <div v-else class="print-sheets-wrapper">
              <div
                v-for="(pageCards, pageIdx) in printPages"
                :key="pageIdx"
                class="a4-print-sheet"
              >
                <!-- Indikator Lembar di Layar (no-print) -->
                <div class="sheet-screen-banner no-print d-flex justify-content-between align-items-center border-bottom pb-2 mb-3 text-muted small">
                  <span class="badge bg-dark rounded-pill px-3 py-1">
                    <i class="bi bi-file-earmark-text me-1"></i> Lembar A4 ke-{{ pageIdx + 1 }} dari {{ printPages.length }}
                  </span>
                  <span class="fw-semibold text-secondary">
                    Kartu ke-{{ pageIdx * 12 + 1 }} s/d {{ Math.min((pageIdx + 1) * 12, printCardsList.length) }}
                  </span>
                </div>

                <!-- 3 Menyamping x 4 Kebawah = 12 Kartu per Halaman -->
                <div class="a4-grid-3x4">
                  <div
                    v-for="card in pageCards"
                    :key="card.id"
                    class="token-card-print"
                  >
                    <!-- Header Kartu -->
                    <div class="card-header-section">
                      <span class="badge-school">E-OSIS {{ electionStore.election?.school_name || 'SMPN 2 KWADUNGAN' }}</span>
                      <h6 class="card-title-main">KARTU PEMILIHAN OSIS</h6>
                      <span class="card-subtitle-period">Tahun Ajaran / Periode {{ electionStore.election?.election_period || '2026/2027' }}</span>
                    </div>

                    <!-- Area QR Code -->
                    <div class="card-qr-section">
                      <img :src="card.qrUrl" alt="QR Token" class="qr-print-image" />
                    </div>

                    <!-- Kotak Kode Token -->
                    <div class="card-token-section">
                      <span class="token-section-label">KODE TOKEN PEMILIH:</span>
                      <strong class="token-section-code">{{ card.token }}</strong>
                    </div>

                    <!-- Keterangan Bawah -->
                    <div class="card-footer-section">
                      Arahkan QR ke kamera bilik suara atau masukkan 6 karakter token
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal: Opsi Pembersihan Token (no-print) -->
    <div v-if="showClearModal" class="modal fade show d-block no-print" tabindex="-1" style="background: rgba(15, 23, 42, 0.6); z-index: 1060;">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-header border-0 pb-0 pt-4 px-4">
            <div>
              <h5 class="fw-bold text-dark mb-1">
                <i class="bi bi-trash3 text-danger me-2"></i>Pembersihan & Penghapusan Token
              </h5>
              <p class="text-muted small mb-0">
                Pilih opsi penghapusan token sesuai kebutuhan pemilihan Anda
              </p>
            </div>
            <button type="button" class="btn-close" @click="showClearModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div class="row g-3">
              <!-- Opsi 1: Hapus Hanya Token Terpakai -->
              <div class="col-md-6">
                <div class="card h-100 border rounded-4 p-3 bg-white d-flex flex-column justify-content-between shadow-xs">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill fw-bold">
                        {{ usedCount }} Token Terpakai
                      </span>
                      <i class="bi bi-check2-circle fs-4 text-primary"></i>
                    </div>
                    <h6 class="fw-bold text-dark mb-2">Hapus Token yang Sudah Digunakan</h6>
                    <p class="text-muted small mb-3">
                      Membersihkan token yang hak suaranya sudah selesai dicoblos agar daftar tidak menumpuk. Token aktif yang belum digunakan <strong>tetap tersimpan aman</strong> untuk siswa lain.
                    </p>
                  </div>
                  <button
                    type="button"
                    class="btn btn-outline-primary rounded-pill w-100 fw-semibold"
                    :disabled="usedCount === 0"
                    @click="promptDeleteUsed"
                  >
                    <i class="bi bi-trash me-1"></i> Hapus {{ usedCount }} Token Terpakai
                  </button>
                </div>
              </div>

              <!-- Opsi 2: Hapus Seluruh Token -->
              <div class="col-md-6">
                <div class="card h-100 border border-danger border-opacity-25 rounded-4 p-3 bg-danger bg-opacity-10 d-flex flex-column justify-content-between shadow-xs">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <span class="badge bg-danger text-white px-2 py-1 rounded-pill fw-bold">
                        {{ tokens.length }} Total Token
                      </span>
                      <i class="bi bi-exclamation-triangle-fill fs-4 text-danger"></i>
                    </div>
                    <h6 class="fw-bold text-danger mb-2">Hapus Seluruh Token & Reset Suara</h6>
                    <p class="text-danger text-opacity-75 small mb-3">
                      Menghapus <strong>SEMUA</strong> token voting tanpa terkecuali sekaligus <strong>mengosongkan seluruh perolehan suara</strong>. Gunakan opsi ini jika ingin mereset total seluruh sistem ke kondisi 0.
                    </p>
                  </div>
                  <button
                    type="button"
                    class="btn btn-danger rounded-pill w-100 fw-semibold"
                    :disabled="tokens.length === 0"
                    @click="promptDeleteAll"
                  >
                    <i class="bi bi-trash3-fill me-1"></i> Hapus Semua & Reset Suara
                  </button>
                </div>
              </div>

              <!-- Opsi 3: Hapus Token Nonaktif (Jika ada) -->
              <div v-if="inactiveCount > 0" class="col-12">
                <div class="card border rounded-4 p-3 bg-light d-flex flex-row justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h6 class="fw-bold text-secondary mb-1">Hapus Token Nonaktif ({{ inactiveCount }} Token)</h6>
                    <small class="text-muted">Hanya menghapus token yang ditandai nonaktif oleh panitia.</small>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary rounded-pill px-3"
                    @click="promptDeleteInactive"
                  >
                    <i class="bi bi-trash me-1"></i> Hapus Nonaktif
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0 px-4 pb-4">
            <button type="button" class="btn btn-outline-secondary rounded-pill px-4" @click="showClearModal = false">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Modal (digunakan untuk Hapus 1-per-1, Hapus Terpilih, Hapus Terpakai, & Hapus Seluruh) -->
    <div class="no-print">
      <ConfirmModal
        :show="showConfirmModal"
        :title="confirmTitle"
        :message="confirmMessage"
        :confirm-text="confirmBtnText"
        :variant="confirmVariant"
        :loading="isProcessingDelete"
        @confirm="executeConfirmAction"
        @cancel="showConfirmModal = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import LoadingSpinner from '../../components/common/LoadingSpinner.vue';
import AlertMessage from '../../components/common/AlertMessage.vue';
import ConfirmModal from '../../components/admin/ConfirmModal.vue';
import { tokenService } from '../../services/tokenService';
import { votingService } from '../../services/votingService';
import { useElectionStore } from '../../stores/election';
import { generateRandomToken, generateMultipleTokens, generateQRCodeDataUrl } from '../../utils/token';
import { formatDateTime } from '../../utils/validation';

const electionStore = useElectionStore();

const loading = ref(true);
const isSaving = ref(false);
const tokens = ref([]);
const search = ref('');
const filterStatus = ref('all');

// Selection state
const selectedTokenIds = ref([]);

const alertMessage = ref(null);
const alertType = ref('success');

const showSingleModal = ref(false);
const manualToken = ref('');
const manualVoterCode = ref('');

const showBatchModal = ref(false);
const batchCount = ref(25);

const previewQRData = ref(null);
const showPrintCardsModal = ref(false);
const printCardsList = ref([]);
const printSourceFilter = ref('active'); // 'active' | 'selected' | 'all'
const printMaxLimit = ref(60);
const isGeneratingPrintCards = ref(false);

const printPages = computed(() => {
  const pages = [];
  const list = printCardsList.value;
  for (let i = 0; i < list.length; i += 12) {
    pages.push(list.slice(i, i + 12));
  }
  return pages;
});

// Modals for cleaning & deleting
const showClearModal = ref(false);
const showConfirmModal = ref(false);
const confirmTitle = ref('Hapus Token');
const confirmMessage = ref('');
const confirmBtnText = ref('Ya, Hapus');
const confirmVariant = ref('danger');
const isProcessingDelete = ref(false);
const confirmAction = ref(null);

const usedCount = computed(() => tokens.value.filter((t) => t.status === 'used' || t.used_at).length);
const unusedCount = computed(() => tokens.value.filter((t) => t.status === 'active' && !t.used_at).length);
const inactiveCount = computed(() => tokens.value.filter((t) => t.status === 'inactive').length);

const filteredTokens = computed(() => {
  return tokens.value.filter((t) => {
    if (filterStatus.value === 'active' && (t.status !== 'active' || t.used_at)) return false;
    if (filterStatus.value === 'used' && t.status !== 'used' && !t.used_at) return false;
    if (filterStatus.value === 'inactive' && t.status !== 'inactive') return false;

    if (search.value) {
      const q = search.value.toUpperCase();
      return t.token.includes(q) || (t.voter_code && t.voter_code.toUpperCase().includes(q));
    }
    return true;
  });
});

const isAllSelected = computed(() => {
  if (filteredTokens.value.length === 0) return false;
  return filteredTokens.value.every((t) => selectedTokenIds.value.includes(t.id));
});

const isIndeterminate = computed(() => {
  const count = filteredTokens.value.filter((t) => selectedTokenIds.value.includes(t.id)).length;
  return count > 0 && count < filteredTokens.value.length;
});

function toggleSelectAll(e) {
  if (e.target.checked) {
    const idsToAdd = filteredTokens.value.map((t) => t.id);
    selectedTokenIds.value = Array.from(new Set([...selectedTokenIds.value, ...idsToAdd]));
  } else {
    const filteredIdSet = new Set(filteredTokens.value.map((t) => t.id));
    selectedTokenIds.value = selectedTokenIds.value.filter((id) => !filteredIdSet.has(id));
  }
}

async function loadTokens() {
  loading.value = true;
  try {
    await electionStore.fetchElection();
    const list = await tokenService.getTokens(electionStore.election?.id);
    tokens.value = list;
  } catch (err) {
    console.error('Failed to load tokens:', err);
  } finally {
    loading.value = false;
  }
}

function randomizeSingleToken() {
  manualToken.value = generateRandomToken();
}

async function saveSingleToken() {
  if (manualToken.value.length !== 6) return;
  isSaving.value = true;
  try {
    const created = await tokenService.createToken({
      election_id: electionStore.election?.id,
      token: manualToken.value.toUpperCase(),
      status: 'active',
      voter_code: manualVoterCode.value || null,
    });
    tokens.value.unshift(created);
    showSingleModal.value = false;
    manualToken.value = '';
    manualVoterCode.value = '';
    alertMessage.value = `Token ${created.token} berhasil dibuat!`;
    alertType.value = 'success';
  } catch (err) {
    alertMessage.value = 'Gagal membuat token: ' + (err.message || 'Token mungkin sudah ada.');
    alertType.value = 'danger';
  } finally {
    isSaving.value = false;
  }
}

async function generateBatch() {
  if (batchCount.value < 1) return;
  isSaving.value = true;
  try {
    const existing = tokens.value.map((t) => t.token);
    const newTokens = generateMultipleTokens(batchCount.value, existing);

    const records = newTokens.map((tok, idx) => ({
      election_id: electionStore.election?.id,
      token: tok,
      status: 'active',
      voter_code: 'VOT-' + String(tokens.value.length + idx + 1).padStart(3, '0'),
    }));

    const createdList = await tokenService.createMultipleTokens(records);
    tokens.value = [...createdList, ...tokens.value];
    showBatchModal.value = false;
    alertMessage.value = `Berhasil generate ${createdList.length} token secara massal!`;
    alertType.value = 'success';
  } catch (err) {
    alertMessage.value = 'Gagal generate token massal: ' + err.message;
    alertType.value = 'danger';
  } finally {
    isSaving.value = false;
  }
}

async function previewQR(token) {
  const qrUrl = await generateQRCodeDataUrl(token, { width: 220 });
  previewQRData.value = { token, qrUrl };
}

async function reloadPrintCards() {
  isGeneratingPrintCards.value = true;
  try {
    let source = [];
    if (printSourceFilter.value === 'selected' && selectedTokenIds.value.length > 0) {
      source = tokens.value.filter((t) => selectedTokenIds.value.includes(t.id));
    } else if (printSourceFilter.value === 'all') {
      source = tokens.value;
    } else {
      // Default: active tokens that are not yet used
      source = tokens.value.filter((t) => t.status === 'active' && !t.used_at);
      // Fallback if no unused tokens found
      if (source.length === 0 && tokens.value.length > 0) {
        source = tokens.value;
      }
    }

    const limit = Number(printMaxLimit.value) || 60;
    const batch = source.slice(0, limit);

    const cards = [];
    for (const t of batch) {
      const qrUrl = await generateQRCodeDataUrl(t.token, {
        width: 200,
        margin: 1,
        darkColor: '#000000',
        lightColor: '#ffffff',
      });
      cards.push({ ...t, qrUrl });
    }
    printCardsList.value = cards;
  } catch (err) {
    console.error('Error generating printable cards:', err);
  } finally {
    isGeneratingPrintCards.value = false;
  }
}

async function changePrintFilter(filterType) {
  printSourceFilter.value = filterType;
  await reloadPrintCards();
}

async function openPrintCardsModal() {
  if (selectedTokenIds.value.length > 0) {
    printSourceFilter.value = 'selected';
  } else {
    printSourceFilter.value = 'active';
  }
  showPrintCardsModal.value = true;
  await reloadPrintCards();
}

async function openPrintSelectedCards() {
  printSourceFilter.value = 'selected';
  showPrintCardsModal.value = true;
  await reloadPrintCards();
}

function triggerPrint() {
  window.print();
}

async function toggleStatus(tokenItem) {
  const newStatus = tokenItem.status === 'active' ? 'inactive' : 'active';
  try {
    await tokenService.updateTokenStatus(tokenItem.id, newStatus);
    tokenItem.status = newStatus;
  } catch (err) {
    console.error('Failed to toggle token status:', err);
  }
}

// 1. HAPUS SATU-PER-SATU
function confirmDelete(tok) {
  confirmTitle.value = 'Hapus Token Pemilih';
  confirmMessage.value = `Apakah Anda yakin ingin menghapus token "${tok.token}"? Token ini tidak akan dapat digunakan lagi untuk memilih.`;
  confirmBtnText.value = 'Ya, Hapus Token Ini';
  confirmVariant.value = 'danger';
  confirmAction.value = async () => {
    await tokenService.deleteToken(tok.id);
    tokens.value = tokens.value.filter((t) => t.id !== tok.id);
    selectedTokenIds.value = selectedTokenIds.value.filter((id) => id !== tok.id);
    alertMessage.value = `Token ${tok.token} berhasil dihapus.`;
    alertType.value = 'success';
  };
  showConfirmModal.value = true;
}

// 2. HAPUS TOKEN YANG DIPILIH (CEKLIS)
function promptDeleteSelected() {
  const count = selectedTokenIds.value.length;
  if (count === 0) return;
  confirmTitle.value = 'Hapus Token Terpilih';
  confirmMessage.value = `Apakah Anda yakin ingin menghapus ${count} token yang telah Anda pilih? Tindakan ini tidak dapat dibatalkan.`;
  confirmBtnText.value = `Ya, Hapus ${count} Token`;
  confirmVariant.value = 'danger';
  confirmAction.value = async () => {
    const ids = [...selectedTokenIds.value];
    await tokenService.deleteSelectedTokens(ids);
    const idSet = new Set(ids);
    tokens.value = tokens.value.filter((t) => !idSet.has(t.id));
    selectedTokenIds.value = [];
    alertMessage.value = `Berhasil menghapus ${count} token terpilih.`;
    alertType.value = 'success';
  };
  showConfirmModal.value = true;
}

// 3. HAPUS HANYA TOKEN YANG SUDAH DIGUNAKAN
function promptDeleteUsed() {
  const count = usedCount.value;
  if (count === 0) return;
  showClearModal.value = false;
  confirmTitle.value = 'Hapus Token yang Sudah Digunakan';
  confirmMessage.value = `Apakah Anda yakin ingin membersihkan ${count} token yang telah selesai digunakan untuk voting? Token aktif yang belum digunakan akan tetap tersimpan aman.`;
  confirmBtnText.value = `Ya, Bersihkan ${count} Token Terpakai`;
  confirmVariant.value = 'primary';
  confirmAction.value = async () => {
    await tokenService.deleteUsedTokens(electionStore.election?.id);
    tokens.value = tokens.value.filter((t) => t.status !== 'used' && !t.used_at);
    selectedTokenIds.value = [];
    alertMessage.value = `Berhasil membersihkan ${count} token yang sudah digunakan.`;
    alertType.value = 'success';
  };
  showConfirmModal.value = true;
}

// 4. HAPUS SELURUH TOKEN (RESET TOTAL)
function promptDeleteAll() {
  const count = tokens.value.length;
  if (count === 0) return;
  showClearModal.value = false;
  confirmTitle.value = 'PERINGATAN: Hapus Seluruh Token & Reset Suara';
  confirmMessage.value = `PERINGATAN KERAS! Anda akan menghapus SELURUH (${count}) token pemilih dan MENGOSONGKAN seluruh suara yang telah masuk. Sistem akan kembali bersih ke 0 untuk memulai sesi baru. Apakah Anda yakin ingin melanjutkan?`;
  confirmBtnText.value = 'Ya, Hapus Semua & Reset Suara';
  confirmVariant.value = 'danger';
  confirmAction.value = async () => {
    const electionId = electionStore.election?.id;
    await tokenService.deleteAllTokens(electionId);
    await votingService.resetVotes(electionId, true);
    tokens.value = [];
    selectedTokenIds.value = [];
    alertMessage.value = `Seluruh data token (${count} token) dan data suara berhasil dihapus bersih dari sistem.`;
    alertType.value = 'success';
  };
  showConfirmModal.value = true;
}

// 5. HAPUS TOKEN NONAKTIF
function promptDeleteInactive() {
  const inactiveTokens = tokens.value.filter((t) => t.status === 'inactive');
  const count = inactiveTokens.length;
  if (count === 0) return;
  showClearModal.value = false;
  confirmTitle.value = 'Hapus Token Nonaktif';
  confirmMessage.value = `Apakah Anda yakin ingin menghapus ${count} token yang berstatus nonaktif?`;
  confirmBtnText.value = `Ya, Hapus ${count} Token Nonaktif`;
  confirmVariant.value = 'secondary';
  confirmAction.value = async () => {
    const ids = inactiveTokens.map((t) => t.id);
    await tokenService.deleteSelectedTokens(ids);
    const idSet = new Set(ids);
    tokens.value = tokens.value.filter((t) => !idSet.has(t.id));
    selectedTokenIds.value = selectedTokenIds.value.filter((id) => !idSet.has(id));
    alertMessage.value = `Berhasil menghapus ${count} token nonaktif.`;
    alertType.value = 'success';
  };
  showConfirmModal.value = true;
}

// Eksekutor konfirmasi umum
async function executeConfirmAction() {
  if (!confirmAction.value) return;
  isProcessingDelete.value = true;
  try {
    await confirmAction.value();
    showConfirmModal.value = false;
  } catch (err) {
    alertMessage.value = 'Terjadi kesalahan saat menghapus: ' + (err.message || err);
    alertType.value = 'danger';
  } finally {
    isProcessingDelete.value = false;
  }
}

onMounted(() => {
  loadTokens();
  manualToken.value = generateRandomToken();
});
</script>

<style scoped>
.fw-extrabold {
  font-weight: 800;
}
.tracking-wider {
  letter-spacing: 4px;
}
.shadow-xs {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.06);
}

/* Screen Preview Styling for A4 Sheets */
.print-sheets-wrapper {
  width: 100%;
}

.a4-print-sheet {
  max-width: 860px;
  margin: 0 auto 24px auto;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.a4-grid-3x4,
.a4-grid-2x3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
}

.token-card-print {
  border: 1.5px dashed #64748b;
  border-radius: 6px;
  padding: 8px 6px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  min-height: 180px;
  box-sizing: border-box;
}

.card-header-section {
  width: 100%;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 3px;
  margin-bottom: 3px;
}

.badge-school {
  background-color: #0f172a;
  color: #ffffff;
  font-size: 8px;
  font-weight: 700;
  padding: 1.5px 6px;
  border-radius: 3px;
  display: inline-block;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-title-main {
  font-size: 9.5px;
  font-weight: 800;
  color: #0f172a;
  margin-top: 2px;
  margin-bottom: 0;
  letter-spacing: 0.4px;
}

.card-subtitle-period {
  font-size: 8px;
  color: #64748b;
  font-weight: 500;
  display: block;
}

.card-qr-section {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 4px 0;
}

.qr-print-image {
  width: 70px;
  height: 70px;
  image-rendering: -webkit-optimize-contrast;
  display: block;
}

.card-token-section {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 2px 4px;
  width: 100%;
  box-sizing: border-box;
}

.token-section-label {
  font-size: 7.5px;
  color: #64748b;
  font-weight: 700;
  display: block;
  letter-spacing: 0.4px;
}

.token-section-code {
  font-size: 15px;
  font-weight: 900;
  color: #0284c7;
  letter-spacing: 2px;
  font-family: monospace;
  display: block;
}

.card-footer-section {
  font-size: 7px;
  color: #64748b;
  margin-top: 3px;
  line-height: 1.15;
}
</style>

<!-- Global Unscoped Print Styles -->
<style>
/* Print Specific Rules: A4 Portrait, 3 Columns x 4 Rows = Tepat 12 Cards Per Page */
@page {
  size: A4 portrait;
  margin: 4.5mm 4.5mm 4.5mm 4.5mm;
}

@media print {
  /* Sembunyikan semua elemen UI dashboard selain kartu cetak */
  .no-print,
  .token-management-dashboard,
  .admin-layout > div > header,
  .admin-sidebar,
  .admin-header,
  aside,
  nav,
  header,
  footer,
  button,
  .btn,
  .alert,
  .modal-backdrop,
  .modal-header,
  .modal-footer {
    display: none !important;
  }

  /* Sembunyikan semua elemen langsung di admin-tokens kecuali modal cetak */
  .admin-tokens > *:not(.print-cards-modal-wrapper) {
    display: none !important;
  }

  .admin-tokens {
    padding: 0 !important;
    margin: 0 !important;
    background: #ffffff !important;
  }

  /* Reset body dan html agar tidak ada scrolling/overflow */
  html,
  body {
    background: #ffffff !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
  }

  /* Reset Bootstrap Modal agar rata dan tidak terpotong */
  .modal {
    position: static !important;
    display: block !important;
    overflow: visible !important;
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
  }

  .modal-dialog {
    max-width: 100% !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    transform: none !important;
  }

  .modal-content {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important;
  }

  .modal-body,
  .printable-area {
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    max-height: none !important;
  }

  .print-sheets-wrapper {
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Tiap lembar A4: Ukuran tinggi 268mm pas untuk 4 baris kartu tanpa overflow ke halaman berikutnya */
  .a4-print-sheet {
    width: 100% !important;
    max-width: 201mm !important;
    height: 268mm !important;
    max-height: 268mm !important;
    min-height: 268mm !important;
    margin: 0 auto !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    border: none !important;
    box-shadow: none !important;
    background: #ffffff !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    page-break-after: always !important;
    break-after: page !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
  }

  .a4-print-sheet:last-child,
  .a4-print-sheet:last-of-type {
    page-break-after: auto !important;
    break-after: auto !important;
  }

  /* Grid 3 Menyamping x 4 Kebawah = 12 Kartu per Lembar */
  .a4-grid-3x4,
  .a4-grid-2x3 {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    grid-template-rows: repeat(4, 64mm) !important;
    gap: 2.5mm !important;
    height: 264mm !important;
    max-height: 264mm !important;
    width: 100% !important;
    box-sizing: border-box !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  /* Kartu Token: Ukuran pas 64mm tinggi x ~65mm lebar */
  .token-card-print {
    border: 1.2px dashed #0f172a !important;
    border-radius: 5px !important;
    background: #ffffff !important;
    padding: 2mm 2.5mm !important;
    box-sizing: border-box !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    align-items: center !important;
    text-align: center !important;
    height: 64mm !important;
    max-height: 64mm !important;
    min-height: 64mm !important;
    overflow: hidden !important;
  }

  .card-header-section {
    width: 100% !important;
    border-bottom: 1px solid #e2e8f0 !important;
    padding-bottom: 1mm !important;
    margin-bottom: 1mm !important;
  }

  .badge-school {
    background-color: #0f172a !important;
    color: #ffffff !important;
    font-size: 7px !important;
    padding: 0.8px 4px !important;
    font-weight: 700 !important;
    letter-spacing: 0.3px !important;
    border-radius: 2.5px !important;
    display: inline-block !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    max-width: 100% !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .card-title-main {
    font-size: 8.5px !important;
    font-weight: 800 !important;
    color: #0f172a !important;
    margin-top: 1px !important;
    margin-bottom: 0 !important;
    letter-spacing: 0.2px !important;
    line-height: 1.1 !important;
  }

  .card-subtitle-period {
    font-size: 7px !important;
    color: #64748b !important;
    font-weight: 500 !important;
    display: block !important;
    line-height: 1.1 !important;
  }

  .card-qr-section {
    margin: 1mm 0 !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
  }

  .qr-print-image {
    width: 55px !important;
    height: 55px !important;
    image-rendering: -webkit-optimize-contrast !important;
    display: block !important;
  }

  .card-token-section {
    background-color: #f1f5f9 !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 3px !important;
    padding: 1mm 2mm !important;
    width: 100% !important;
    box-sizing: border-box !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .token-section-label {
    font-size: 6.5px !important;
    font-weight: 700 !important;
    color: #64748b !important;
    letter-spacing: 0.3px !important;
    line-height: 1 !important;
    display: block !important;
  }

  .token-section-code {
    font-size: 13.5px !important;
    font-weight: 900 !important;
    letter-spacing: 2px !important;
    color: #0284c7 !important;
    line-height: 1.1 !important;
    font-family: monospace !important;
    display: block !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .card-footer-section {
    font-size: 6px !important;
    color: #64748b !important;
    margin-top: 1mm !important;
    line-height: 1.1 !important;
  }
}
</style>
