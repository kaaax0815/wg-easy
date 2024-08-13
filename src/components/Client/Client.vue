<template>
  <!-- Chart -->
  <ClientCharts :client="client" />
  <div
    class="relative py-3 md:py-5 px-3 z-10 flex flex-col sm:flex-row justify-between gap-3"
  >
    <div class="flex gap-3 md:gap-4 w-full items-center">
      <!-- Avatar -->
      <div class="h-10 w-10 mt-2 self-start rounded-full bg-gray-50 relative">
        <svg
          class="w-6 m-2 text-gray-300"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clip-rule="evenodd"
          />
        </svg>
        <img
          v-if="client.avatar"
          :src="client.avatar"
          class="w-10 rounded-full absolute top-0 left-0"
        />

        <div
          v-if="
            client.latestHandshakeAt &&
            new Date().getTime() -
              new Date(client.latestHandshakeAt).getTime() <
              1000 * 60 * 10
          "
        >
          <div
            class="animate-ping w-4 h-4 p-1 bg-red-100 dark:bg-red-100 rounded-full absolute -bottom-1 -right-1"
          />
          <div
            class="w-2 h-2 bg-red-800 dark:bg-red-600 rounded-full absolute bottom-0 right-0"
          />
        </div>
      </div>

      <!-- Name & Info -->
      <div class="flex flex-col xxs:flex-row w-full gap-2">
        <!-- Name -->
        <div class="flex flex-col flex-grow gap-1">
          <div
            class="text-gray-700 dark:text-neutral-200 group text-sm md:text-base"
            :title="$t('createdOn') + dateTime(new Date(client.createdAt))"
          >
            <!-- Show -->
            <input
              v-show="clientEditNameId === client.id"
              ref="clientNameInput"
              v-model="clientEditName"
              class="rounded px-1 border-2 dark:bg-neutral-700 border-gray-100 dark:border-neutral-600 focus:border-gray-200 dark:focus:border-neutral-500 dark:placeholder:text-neutral-500 outline-none w-30"
              @keyup.enter="
                updateClientName(client, clientEditName);
                clientEditName = null;
                clientEditNameId = null;
              "
              @keyup.escape="
                clientEditName = null;
                clientEditNameId = null;
              "
            />
            <span
              v-show="clientEditNameId !== client.id"
              class="border-t-2 border-b-2 border-transparent"
              >{{ client.name }}</span
            >

            <!-- Edit -->
            <span
              v-show="clientEditNameId !== client.id"
              class="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              @click="
                clientEditName = client.name;
                clientEditNameId = client.id;
                nextTick(() => clientNameInput?.select());
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 inline align-middle opacity-25 hover:opacity-100"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </span>
          </div>
          <!-- Address -->
          <div
            class="block md:inline-block pb-1 md:pb-0 text-gray-500 dark:text-neutral-400 text-xs"
          >
            <span class="group">
              <!-- Show -->
              <input
                v-show="clientEditAddressId === client.id"
                ref="clientAddressInput"
                v-model="clientEditAddress"
                class="rounded border-2 dark:bg-neutral-700 border-gray-100 dark:border-neutral-600 focus:border-gray-200 dark:focus:border-neutral-500 outline-none w-20 text-black dark:text-neutral-300 dark:placeholder:text-neutral-500"
                @keyup.enter="
                  updateClientAddress(client, clientEditAddress);
                  clientEditAddress = null;
                  clientEditAddressId = null;
                "
                @keyup.escape="
                  clientEditAddress = null;
                  clientEditAddressId = null;
                "
              />
              <span
                v-show="clientEditAddressId !== client.id"
                class="inline-block"
                >{{ client.address }}</span
              >

              <!-- Edit -->
              <span
                v-show="clientEditAddressId !== client.id"
                class="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                @click="
                  clientEditAddress = client.address;
                  clientEditAddressId = client.id;
                  nextTick(() => clientAddressInput?.select());
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 inline align-middle opacity-25 hover:opacity-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </span>
            </span>
            <!-- Inline Transfer TX -->
            <span
              v-if="!globalStore.uiTrafficStats && client.transferTx"
              class="whitespace-nowrap"
              :title="$t('totalDownload') + bytes(client.transferTx)"
            >
              ·
              <svg
                class="align-middle h-3 inline"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ bytes(client.transferTxCurrent) }}/s
            </span>

            <!-- Inline Transfer RX -->
            <span
              v-if="!globalStore.uiTrafficStats && client.transferRx"
              class="whitespace-nowrap"
              :title="$t('totalUpload') + bytes(client.transferRx)"
            >
              ·
              <svg
                class="align-middle h-3 inline"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ bytes(client.transferRxCurrent) }}/s
            </span>
            <!-- Last seen -->
            <span
              v-if="client.latestHandshakeAt"
              class="text-gray-400 dark:text-neutral-500 whitespace-nowrap"
              :title="
                $t('lastSeen') + dateTime(new Date(client.latestHandshakeAt))
              "
            >
              {{ !globalStore.uiTrafficStats ? ' · ' : ''
              }}{{ timeago(new Date(client.latestHandshakeAt)) }}
            </span>
          </div>
        </div>

        <!-- Info -->
        <div
          v-if="globalStore.uiTrafficStats"
          class="flex gap-2 items-center shrink-0 text-gray-400 dark:text-neutral-400 text-xs mt-px justify-end"
        >
          <!-- Transfer TX -->
          <div v-if="client.transferTx" class="min-w-20 md:min-w-24">
            <span
              class="flex gap-1"
              :title="$t('totalDownload') + bytes(client.transferTx)"
            >
              <svg
                class="align-middle h-3 inline mt-0.5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <div>
                <span class="text-gray-700 dark:text-neutral-200"
                  >{{ bytes(client.transferTxCurrent) }}/s</span
                >
                <!-- Total TX -->
                <br /><span class="font-regular" style="font-size: 0.85em">{{
                  bytes(client.transferTx)
                }}</span>
              </div>
            </span>
          </div>

          <!-- Transfer RX -->
          <div v-if="client.transferRx" class="min-w-20 md:min-w-24">
            <span
              class="flex gap-1"
              :title="$t('totalUpload') + bytes(client.transferRx)"
            >
              <svg
                class="align-middle h-3 inline mt-0.5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <div>
                <span class="text-gray-700 dark:text-neutral-200"
                  >{{ bytes(client.transferRxCurrent) }}/s</span
                >
                <!-- Total RX -->
                <br /><span class="font-regular" style="font-size: 0.85em">{{
                  bytes(client.transferRx)
                }}</span>
              </div>
            </span>
          </div>
        </div>
      </div>
      <!-- </div> -->
      <!-- <div class="flex flex-grow items-center"> -->
    </div>

    <div class="flex items-center justify-end">
      <div
        class="text-gray-400 dark:text-neutral-400 flex gap-1 items-center justify-between"
      >
        <!-- Enable/Disable -->
        <div
          v-if="client.enabled === true"
          :title="$t('disableClient')"
          class="inline-block align-middle rounded-full w-10 h-6 mr-1 bg-red-800 cursor-pointer hover:bg-red-700 transition-all"
          @click="disableClient(client)"
        >
          <div class="rounded-full w-4 h-4 m-1 ml-5 bg-white" />
        </div>

        <div
          v-if="client.enabled === false"
          :title="$t('enableClient')"
          class="inline-block align-middle rounded-full w-10 h-6 mr-1 bg-gray-200 dark:bg-neutral-400 cursor-pointer hover:bg-gray-300 dark:hover:bg-neutral-500 transition-all"
          @click="enableClient(client)"
        >
          <div class="rounded-full w-4 h-4 m-1 bg-white" />
        </div>

        <!-- Show QR-->

        <button
          :disabled="!client.downloadableConfig"
          class="align-middle bg-gray-100 dark:bg-neutral-600 dark:text-neutral-300 p-2 rounded transition"
          :class="{
            'hover:bg-red-800 dark:hover:bg-red-800 hover:text-white dark:hover:text-white':
              client.downloadableConfig,
            'is-disabled': !client.downloadableConfig,
          }"
          :title="!client.downloadableConfig ? $t('noPrivKey') : $t('showQR')"
          @click="
            modalStore.qrcode = `./api/wireguard/client/${client.id}/qrcode.svg`
          "
        >
          <svg
            class="w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
        </button>

        <!-- Download Config -->
        <a
          :disabled="!client.downloadableConfig"
          :href="'./api/wireguard/client/' + client.id + '/configuration'"
          :download="client.downloadableConfig ? 'configuration' : null"
          class="align-middle inline-block bg-gray-100 dark:bg-neutral-600 dark:text-neutral-300 p-2 rounded transition"
          :class="{
            'hover:bg-red-800 dark:hover:bg-red-800 hover:text-white dark:hover:text-white':
              client.downloadableConfig,
            'is-disabled': !client.downloadableConfig,
          }"
          :title="
            !client.downloadableConfig ? $t('noPrivKey') : $t('downloadConfig')
          "
          @click="
            if (!client.downloadableConfig) {
              $event.preventDefault();
            }
          "
        >
          <svg
            class="w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </a>

        <!-- Delete -->

        <button
          class="align-middle bg-gray-100 dark:bg-neutral-600 dark:text-neutral-300 hover:bg-red-800 dark:hover:bg-red-800 hover:text-white dark:hover:text-white p-2 rounded transition"
          :title="$t('deleteClient')"
          @click="modalStore.clientDelete = client"
        >
          <svg
            class="w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format as timeago } from 'timeago.js';

const clientsStore = useClientsStore();
const globalStore = useGlobalStore();
const modalStore = useModalStore();

defineProps<{
  client: LocalClient;
}>();

const clientNameInput = ref<HTMLInputElement | null>(null);
const clientAddressInput = ref<HTMLInputElement | null>(null);

const clientEditName = ref<null | string>(null);
const clientEditNameId = ref<null | string>(null);
const clientEditAddress = ref<null | string>(null);
const clientEditAddressId = ref<null | string>(null);

function enableClient(client: WGClient) {
  api
    .enableClient({ clientId: client.id })
    .catch((err) => alert(err.message || err.toString()))
    .finally(() => clientsStore.refresh().catch(console.error));
}
function disableClient(client: WGClient) {
  api
    .disableClient({ clientId: client.id })
    .catch((err) => alert(err.message || err.toString()))
    .finally(() => clientsStore.refresh().catch(console.error));
}
function updateClientName(client: WGClient, name: string | null) {
  if (name === null) {
    return;
  }
  api
    .updateClientName({ clientId: client.id, name })
    .catch((err) => alert(err.message || err.toString()))
    .finally(() => clientsStore.refresh().catch(console.error));
}
function updateClientAddress(client: WGClient, address: string | null) {
  if (address === null) {
    return;
  }
  api
    .updateClientAddress({ clientId: client.id, address })
    .catch((err) => alert(err.message || err.toString()))
    .finally(() => clientsStore.refresh().catch(console.error));
}
</script>
