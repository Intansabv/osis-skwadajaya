<template>
  <div class="success-view py-4">
    <VotingSuccess
      :countdown="votingStore.countdown"
      @redirect-now="handleRedirectNow"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import VotingSuccess from '../../components/voting/VotingSuccess.vue';
import { useVotingStore } from '../../stores/voting';

const router = useRouter();
const votingStore = useVotingStore();

function handleRedirectNow() {
  votingStore.clearSession();
  router.replace('/');
}

onMounted(() => {
  // Start the 4-second auto-redirect countdown
  votingStore.startSuccessCountdown(() => {
    router.replace('/');
  });
});
</script>
