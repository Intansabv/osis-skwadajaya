import { createRouter, createWebHashHistory } from 'vue-router';
import { supabase } from '../services/supabase';
import VotingLayout from '../layouts/VotingLayout.vue';
import AdminLayout from '../layouts/AdminLayout.vue';

// Voting Views
import VotingHome from '../views/voting/Home.vue';
import ScanToken from '../views/voting/ScanToken.vue';
import ManualToken from '../views/voting/ManualToken.vue';
import VotingCandidates from '../views/voting/Candidates.vue';
import VotingSuccess from '../views/voting/Success.vue';

// Admin Views
import AdminLogin from '../views/admin/Login.vue';
import AdminDashboard from '../views/admin/Dashboard.vue';
import AdminVoters from '../views/admin/Voters.vue';
import AdminTokens from '../views/admin/Tokens.vue';
import AdminCandidates from '../views/admin/Candidates.vue';
import AdminResults from '../views/admin/Results.vue';
import AdminSettings from '../views/admin/Settings.vue';

const routes = [
  // Student Voting Routes (Clean, minimal kiosk/booth layout)
  {
    path: '/',
    component: VotingLayout,
    children: [
      {
        path: '',
        name: 'VotingHome',
        component: VotingHome,
      },
      {
        path: 'vote/scan',
        name: 'ScanToken',
        component: ScanToken,
      },
      {
        path: 'vote/manual',
        name: 'ManualToken',
        component: ManualToken,
      },
      {
        path: 'vote/candidates',
        name: 'VotingCandidates',
        component: VotingCandidates,
        meta: { requiresToken: true },
      },
      {
        path: 'vote/success',
        name: 'VotingSuccess',
        component: VotingSuccess,
      },
    ],
  },

  // Admin Login
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin,
  },

  // Admin Panel Routes
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: AdminDashboard,
      },
      {
        path: 'voters',
        name: 'AdminVoters',
        component: AdminVoters,
      },
      {
        path: 'tokens',
        name: 'AdminTokens',
        component: AdminTokens,
      },
      {
        path: 'candidates',
        name: 'AdminCandidates',
        component: AdminCandidates,
      },
      {
        path: 'results',
        name: 'AdminResults',
        component: AdminResults,
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: AdminSettings,
      },
    ],
  },

  // Catch-all route
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

// Navigation Guards
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession();
  const isAdminAuthenticated = !!session?.user;

  if (to.name === 'AdminLogin' && isAdminAuthenticated) {
    next({ name: 'AdminDashboard' });
    return;
  }

  if (to.meta.requiresAdmin && !isAdminAuthenticated) {
    next({ name: 'AdminLogin' });
    return;
  }

  if (to.meta.requiresToken) {
    const voterSession = sessionStorage.getItem('eosis_voter_session');
    if (!voterSession) {
      next({ name: 'VotingHome' });
      return;
    }
  }

  next();
});

export default router;
