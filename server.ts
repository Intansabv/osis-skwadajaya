import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface Election {
  id: string;
  school_name: string;
  school_logo_url: string;
  election_title: string;
  election_period: string;
  status: string;
  start_at: string;
  end_at: string;
  chairman_name?: string;
  chairman_nip?: string;
  custom_print_date?: string;
}

interface Candidate {
  id: string;
  election_id: string;
  number: number;
  chairman_name: string;
  vice_chairman_name: string;
  photo_url: string;
  slogan: string;
  vision: string;
  mission: string;
  is_active: boolean;
}

interface VoterToken {
  id: string;
  election_id: string;
  token: string;
  status: string; // 'active' | 'used' | 'inactive'
  voter_code?: string;
  voter_name?: string;
  used_at?: string | null;
  created_at: string;
}

interface Vote {
  id: string;
  election_id: string;
  candidate_id: string;
  candidate_number: number;
  voted_at: string;
}

interface AppDatabase {
  election: Election;
  candidates: Candidate[];
  tokens: VoterToken[];
  votes: Vote[];
}

function initDB(): AppDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed reading existing db.json, creating initial backup:', e);
    }
  }

  const initialDB: AppDatabase = {
    election: {
      id: '00000000-0000-0000-0000-000000000001',
      school_name: 'SMP NEGERI 2 KWADUNGAN',
      school_logo_url: '/logo-ngawi.svg',
      election_title: 'Pemilihan Ketua dan Wakil Ketua OSIS',
      election_period: '2026/2027',
      status: 'Berlangsung',
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      chairman_name: '',
      chairman_nip: '',
      custom_print_date: '',
    },
    candidates: [],
    tokens: [],
    votes: [],
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
  return initialDB;
}

let db: AppDatabase = initDB();

function saveDB() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

async function startServer() {
  const app = express();

  // Allow larger payload for image uploads (base64 logos)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Prevent CORS issues across multiple devices on the network
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // 1. Election endpoints
  app.get('/api/election', (req, res) => {
    res.json(db.election);
  });

  app.put('/api/election', (req, res) => {
    const updates = req.body || {};
    db.election = {
      ...db.election,
      ...updates,
    };
    saveDB();
    res.json(db.election);
  });

  app.post('/api/upload-logo', (req, res) => {
    const { logo } = req.body;
    if (!logo) {
      return res.status(400).json({ error: 'Logo data diperlukan' });
    }
    db.election.school_logo_url = logo;
    saveDB();
    res.json({ success: true, url: logo });
  });

  // 2. Candidates endpoints
  app.get('/api/candidates', (req, res) => {
    const sorted = [...db.candidates].sort((a, b) => a.number - b.number);
    res.json(sorted);
  });

  app.post('/api/candidates', (req, res) => {
    const candidateData = req.body;
    const newCand: Candidate = {
      ...candidateData,
      id: candidateData.id || 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      election_id: candidateData.election_id || db.election.id,
      number: Number(candidateData.number) || db.candidates.length + 1,
      is_active: candidateData.is_active !== undefined ? candidateData.is_active : true,
    };
    db.candidates.push(newCand);
    db.candidates.sort((a, b) => a.number - b.number);
    saveDB();
    res.status(201).json(newCand);
  });

  app.put('/api/candidates/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const idx = db.candidates.findIndex((c) => c.id === id || String(c.number) === String(id));
    if (idx === -1) {
      return res.status(404).json({ error: 'Kandidat tidak ditemukan' });
    }
    db.candidates[idx] = {
      ...db.candidates[idx],
      ...updates,
      number: updates.number !== undefined ? Number(updates.number) : db.candidates[idx].number,
    };
    db.candidates.sort((a, b) => a.number - b.number);
    saveDB();
    res.json(db.candidates[idx]);
  });

  app.delete('/api/candidates/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = db.candidates.length;
    db.candidates = db.candidates.filter((c) => c.id !== id);
    saveDB();
    res.json({ success: db.candidates.length < initialLen });
  });

  // 3. Tokens endpoints
  app.get('/api/tokens', (req, res) => {
    res.json(db.tokens);
  });

  app.post('/api/tokens', (req, res) => {
    const item = req.body;
    const cleanToken = (item.token || '').trim().toUpperCase();
    if (!cleanToken) {
      return res.status(400).json({ error: 'Kode token tidak boleh kosong' });
    }
    const exists = db.tokens.some((t) => t.token.toUpperCase() === cleanToken);
    if (exists) {
      return res.status(409).json({ error: 'Token ini sudah ada sebelumnya' });
    }
    const newToken: VoterToken = {
      id: item.id || 'tok-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      election_id: item.election_id || db.election.id,
      token: cleanToken,
      status: item.status || 'active',
      voter_code: item.voter_code || `VOT-${String(db.tokens.length + 1).padStart(3, '0')}`,
      voter_name: item.voter_name || '',
      used_at: null,
      created_at: new Date().toISOString(),
    };
    db.tokens.unshift(newToken);
    saveDB();
    res.status(201).json(newToken);
  });

  app.post('/api/tokens/batch', (req, res) => {
    const { tokens } = req.body;
    if (!Array.isArray(tokens)) {
      return res.status(400).json({ error: 'Format tokens harus berupa array' });
    }

    const existingSet = new Set(db.tokens.map((t) => t.token.toUpperCase()));
    const inserted: VoterToken[] = [];

    for (const item of tokens) {
      const cleanToken = (item.token || '').trim().toUpperCase();
      if (cleanToken && !existingSet.has(cleanToken)) {
        existingSet.add(cleanToken);
        const record: VoterToken = {
          id: item.id || 'tok-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          election_id: item.election_id || db.election.id,
          token: cleanToken,
          status: item.status || 'active',
          voter_code: item.voter_code || `VOT-${String(db.tokens.length + inserted.length + 1).padStart(3, '0')}`,
          voter_name: item.voter_name || '',
          used_at: null,
          created_at: new Date().toISOString(),
        };
        inserted.push(record);
      }
    }

    db.tokens.unshift(...inserted);
    saveDB();
    res.status(201).json({ success: true, count: inserted.length, tokens: inserted });
  });

  app.put('/api/tokens/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const idx = db.tokens.findIndex((t) => t.id === id || t.token.toUpperCase() === id.toUpperCase());
    if (idx === -1) {
      return res.status(404).json({ error: 'Token tidak ditemukan' });
    }
    db.tokens[idx] = {
      ...db.tokens[idx],
      ...updates,
    };
    saveDB();
    res.json(db.tokens[idx]);
  });

  app.delete('/api/tokens/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = db.tokens.length;
    db.tokens = db.tokens.filter((t) => t.id !== id && t.token.toUpperCase() !== id.toUpperCase());
    saveDB();
    res.json({ success: db.tokens.length < initialLen });
  });

  app.post('/api/tokens/clear', (req, res) => {
    db.tokens = [];
    saveDB();
    res.json({ success: true, message: 'Semua token telah dihapus' });
  });

  // 4. Voting & Validation
  app.post('/api/vote/validate', (req, res) => {
    const { token: rawToken } = req.body;
    const cleanToken = (rawToken || '').toString().trim().toUpperCase();

    if (!cleanToken || cleanToken.length < 5) {
      return res.json({
        valid: false,
        code: 'INVALID_FORMAT',
        message: 'Format token tidak valid. Token harus terdiri dari 6 karakter.',
      });
    }

    if (db.election.status !== 'Berlangsung') {
      return res.json({
        valid: false,
        code: 'ELECTION_INACTIVE',
        message: `Pemilihan sedang berstatus "${db.election.status}". Silakan menunggu instruksi panitia.`,
      });
    }

    const found = db.tokens.find((t) => t.token.toUpperCase() === cleanToken);
    if (!found) {
      return res.json({
        valid: false,
        code: 'NOT_FOUND',
        message: 'Token tidak ditemukan atau tidak terdaftar.',
      });
    }

    if (found.status === 'used' || found.used_at) {
      return res.json({
        valid: false,
        code: 'ALREADY_USED',
        message: 'Token ini sudah pernah digunakan untuk memberikan suara.',
      });
    }

    if (found.status === 'inactive') {
      return res.json({
        valid: false,
        code: 'INACTIVE_TOKEN',
        message: 'Token ini dinonaktifkan oleh panitia OSIS.',
      });
    }

    return res.json({
      valid: true,
      token: cleanToken,
      election_id: db.election.id,
      election_title: db.election.election_title,
      election_period: db.election.election_period,
      school_name: db.election.school_name,
      school_logo_url: db.election.school_logo_url,
      message: 'Token valid. Silakan tentukan kandidat pilihan Anda.',
    });
  });

  app.post('/api/vote/cast', (req, res) => {
    const { token: rawToken, candidateId } = req.body;
    const cleanToken = (rawToken || '').toString().trim().toUpperCase();

    if (!cleanToken) {
      return res.status(400).json({ success: false, code: 'INVALID_FORMAT', message: 'Token tidak boleh kosong' });
    }

    if (!candidateId) {
      return res.status(400).json({ success: false, code: 'NO_CANDIDATE', message: 'Silakan pilih pasangan calon' });
    }

    if (db.election.status !== 'Berlangsung') {
      return res.status(400).json({ success: false, code: 'ELECTION_INACTIVE', message: 'Pemilihan sedang tidak aktif' });
    }

    // Verify token
    const tokenIndex = db.tokens.findIndex((t) => t.token.toUpperCase() === cleanToken);
    if (tokenIndex === -1) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Token tidak ditemukan' });
    }

    const targetToken = db.tokens[tokenIndex];
    if (targetToken.status === 'used' || targetToken.used_at) {
      return res.status(400).json({ success: false, code: 'ALREADY_USED', message: 'Token sudah digunakan sebelumnya' });
    }

    if (targetToken.status === 'inactive') {
      return res.status(400).json({ success: false, code: 'INACTIVE', message: 'Token nonaktif' });
    }

    // Verify candidate
    const candidate = db.candidates.find(
      (c) => c.id === candidateId || String(c.number) === String(candidateId)
    );
    if (!candidate || !candidate.is_active) {
      return res.status(400).json({
        success: false,
        code: 'CANDIDATE_NOT_AVAILABLE',
        message: 'Kandidat pilihan tidak tersedia atau nonaktif',
      });
    }

    // ATOMIC UPDATE: Mark token as used & record vote
    const nowIso = new Date().toISOString();
    targetToken.status = 'used';
    targetToken.used_at = nowIso;

    const newVote: Vote = {
      id: 'v-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      election_id: db.election.id,
      candidate_id: candidate.id,
      candidate_number: candidate.number,
      voted_at: nowIso,
    };
    db.votes.push(newVote);

    saveDB();

    return res.json({
      success: true,
      code: 'VOTE_RECORDED',
      message: 'Suara Anda berhasil dicatat secara resmi ke server.',
      candidate_number: candidate.number,
    });
  });

  // 5. Aggregated Live Results
  app.get('/api/results', (req, res) => {
    const totalTokens = db.tokens.length;
    const usedTokens = db.tokens.filter((t) => t.status === 'used' || t.used_at).length;
    const unusedTokens = db.tokens.filter((t) => t.status === 'active' && !t.used_at).length;
    const totalVotes = Math.max(db.votes.length, usedTokens);

    const candidatesResult = db.candidates
      .filter((c) => c.is_active)
      .map((c) => {
        const count = db.votes.filter(
          (v) => v.candidate_id === c.id || String(v.candidate_number) === String(c.number)
        ).length;
        const percentage = totalVotes > 0 ? parseFloat(((count / totalVotes) * 100).toFixed(1)) : 0;
        return {
          id: c.id,
          number: c.number,
          chairman_name: c.chairman_name,
          vice_chairman_name: c.vice_chairman_name,
          photo_url: c.photo_url,
          slogan: c.slogan,
          votes: count,
          vote_count: count,
          percentage,
        };
      })
      .sort((a, b) => a.number - b.number);

    const turnout = totalTokens > 0 ? parseFloat(((usedTokens / totalTokens) * 100).toFixed(1)) : 0;

    res.json({
      election_id: db.election.id,
      total_tokens: totalTokens,
      used_tokens: usedTokens,
      unused_tokens: unusedTokens,
      total_votes: totalVotes,
      turnout_percentage: turnout,
      candidates: candidatesResult,
    });
  });

  // 5b. Reset Votes (Kosongkan seluruh suara yang masuk & kembalikan status token)
  app.post('/api/votes/reset', (req, res) => {
    const { resetTokens = false } = req.body || {};
    db.votes = [];
    if (resetTokens) {
      db.tokens = db.tokens.map((t) => ({
        ...t,
        status: t.status === 'used' ? 'active' : t.status,
        used_at: null,
      }));
    }
    saveDB();
    res.json({
      success: true,
      message: 'Seluruh perolehan suara berhasil dikosongkan (reset ke 0)',
      votesCount: 0,
      tokensCount: db.tokens.length,
    });
  });

  // 6. Reset database to initial seed (if needed)
  app.post('/api/reset-data', (req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        fs.unlinkSync(DB_FILE);
      }
      db = initDB();
      res.json({ success: true, message: 'Database telah direset ke setelan awal' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 7. Auth Login API
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body || {};
    if (identifier === 'admin' && (password === 'admin123' || password === 'admin')) {
      return res.json({
        success: true,
        user: {
          id: 'admin-01',
          username: 'admin',
          name: 'Administrator Pemilihan',
          role: 'admin',
        },
      });
    }
    return res.status(401).json({ error: 'Username atau password admin salah' });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
