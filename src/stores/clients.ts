import { defineStore } from 'pinia';
import { sha256 } from 'js-sha256';

export type LocalClient = WGClient & {
  avatar?: string;
  transferMax?: number;
} & Omit<ClientPersist, 'transferRxPrevious' | 'transferTxPrevious'>;

export type ClientPersist = {
  transferRxHistory: number[];
  transferRxPrevious: number;
  transferRxCurrent: number;
  transferRxSeries: { name: string; data: number[] }[];
  hoverRx?: unknown;
  transferTxHistory: number[];
  transferTxPrevious: number;
  transferTxCurrent: number;
  transferTxSeries: { name: string; data: number[] }[];
  hoverTx?: unknown;
};

export const useClientsStore = defineStore('Clients', () => {
  const clients = ref<null | LocalClient[]>(null);
  const clientsPersist = ref<Record<string, ClientPersist>>({});

  async function refresh({ updateCharts = false } = {}) {
    const _clients = await api.getClients();
    clients.value = _clients.map((client) => {
      let avatar = undefined;
      if (client.name.includes('@') && client.name.includes('.')) {
        avatar = `https://gravatar.com/avatar/${sha256(client.name.toLowerCase().trim())}.jpg`;
      }

      if (!clientsPersist.value[client.id]) {
        clientsPersist.value[client.id] = {
          transferRxHistory: Array(50).fill(0),
          transferRxPrevious: client.transferRx ?? 0,
          transferTxHistory: Array(50).fill(0),
          transferTxPrevious: client.transferTx ?? 0,
          transferRxCurrent: 0,
          transferTxCurrent: 0,
          transferRxSeries: [],
          transferTxSeries: [],
        };
      }

      const clientPersist = clientsPersist.value[client.id];

      // Debug
      // client.transferRx = this.clientsPersist[client.id].transferRxPrevious + Math.random() * 1000;
      // client.transferTx = this.clientsPersist[client.id].transferTxPrevious + Math.random() * 1000;
      // client.latestHandshakeAt = new Date();
      // this.requiresPassword = true;

      clientPersist.transferRxCurrent =
        (client.transferRx ?? 0) - clientPersist.transferRxPrevious;

      clientPersist.transferRxPrevious = client.transferRx ?? 0;

      clientPersist.transferTxCurrent =
        (client.transferTx ?? 0) - clientPersist.transferTxPrevious;

      clientPersist.transferTxPrevious = client.transferTx ?? 0;

      let transferMax = undefined;

      if (updateCharts) {
        clientPersist.transferRxHistory.push(clientPersist.transferRxCurrent);
        clientPersist.transferRxHistory.shift();

        clientPersist.transferTxHistory.push(clientPersist.transferTxCurrent);
        clientPersist.transferTxHistory.shift();

        clientPersist.transferTxSeries = [
          {
            name: 'Tx',
            data: clientPersist.transferTxHistory,
          },
        ];

        clientPersist.transferRxSeries = [
          {
            name: 'Rx',
            data: clientPersist.transferRxHistory,
          },
        ];

        transferMax = Math.max(
          ...clientPersist.transferTxHistory,
          ...clientPersist.transferRxHistory
        );
      }

      return {
        ...client,
        avatar,
        transferTxHistory: clientPersist.transferTxHistory,
        transferRxHistory: clientPersist.transferRxHistory,
        transferMax,
        transferTxSeries: clientPersist.transferTxSeries,
        transferRxSeries: clientPersist.transferRxSeries,
        transferTxCurrent: clientPersist.transferTxCurrent,
        transferRxCurrent: clientPersist.transferRxCurrent,
        hoverTx: clientPersist.hoverTx,
        hoverRx: clientPersist.hoverRx,
      };
    });
  }
  return { clients, clientsPersist, refresh };
});
