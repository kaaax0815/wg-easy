<template>
  <div>
    <p class="p-8 text-center text-lg">
      {{ $t('setup.createAdminDesc') }}
    </p>
    <div class="flex flex-col gap-3">
      <div class="flex flex-col">
        <FormNullTextField
          id="username"
          v-model="username"
          autocomplete="username"
          :label="$t('general.username')"
        />
      </div>
      <div class="flex flex-col">
        <FormPasswordField
          id="password"
          v-model="password"
          autocomplete="new-password"
          :label="$t('general.password')"
        />
      </div>
      <div>
        <BaseButton @click="submit">{{ $t('setup.createAccount') }}</BaseButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'setup',
});

const setupStore = useSetupStore();
setupStore.setStep(2);

const username = ref<null | string>(null);
const password = ref<string>('');

const _submit = useSubmit(
  '/api/setup/2',
  {
    method: 'post',
  },
  {
    revert: async (success) => {
      if (success) {
        await navigateTo('/setup/3');
      }
    },
    noSuccessToast: true,
  }
);

function submit() {
  return _submit({ username: username.value, password: password.value });
}
</script>
