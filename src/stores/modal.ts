import { defineStore } from 'pinia';

export const useModalStore = defineStore('Modal', () => {
  const clientsStore = useClientsStore();
  const clientDelete = ref<null | WGClient>(null);
  const clientCreate = ref<null | boolean>(null);
  const clientCreateName = ref<string>('');
  const qrcode = ref<null | string>(null);

  function createClient() {
    const name = clientCreateName.value;
    if (!name) return;

    api
      .createClient({ name })
      .catch((err) => alert(err.message || err.toString()))
      .finally(() => clientsStore.refresh().catch(console.error));
  }
  function deleteClient(client: WGClient | null) {
    if (client === null) {
      return;
    }
    api
      .deleteClient({ clientId: client.id })
      .catch((err) => alert(err.message || err.toString()))
      .finally(() => clientsStore.refresh().catch(console.error));
  }
  return {
    clientDelete,
    clientCreate,
    clientCreateName,
    qrcode,
    createClient,
    deleteClient,
  };
});
