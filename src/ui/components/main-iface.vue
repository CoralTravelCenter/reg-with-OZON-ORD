<script setup>
import { ref, watch, reactive, computed, onMounted, provide, watchEffect } from 'vue';
import NoSuitableSelection from "./NoSuitableSelection.vue";
import RegSelected from "./RegSelected.vue";
import { Setting, WarningFilled, CircleCheckFilled } from "@element-plus/icons-vue";
import { api_endpoint_host } from "../../commons";


const localSettings = reactive({
    brands: [
        { key: 'coral', name: 'Coral Travel', apiKey: null, selected: true },
        { key: 'sunmar', name: 'Sunmar', apiKey: null, selected: false },
    ],
    settings: {}
});

const settingsDrawerOpen = ref(false);
const settingsDrawer = ref(null);

const hasValidSelection = ref(false);
const selectionInfos = ref([]);
const figmaPageHref = ref('');
const figmaPagePluginData = ref({});

let activeComponent = computed(() => {
    return hasValidSelection.value && selectedBrand().apiKey ? RegSelected : NoSuitableSelection;
});

onMounted(() => {
    window.addEventListener('message', ({ data: { pluginMessage: msg } }) => {
        switch (msg.key) {
            case 'valid-selection':
                // console.log('+++ VALID SELECTION: %o', msg.value);
                hasValidSelection.value = true;
                selectionInfos.value = msg.value;
                figmaPageHref.value = msg.figmaPageHref;
                figmaPagePluginData.value = msg.pagePluginData;
                break;
            case 'invalid-selection':
                // console.log('+++ INVALID SELECTION');
                hasValidSelection.value = false;
                selectionInfos.value = [];
                figmaPageHref.value = '';
                figmaPagePluginData.value = {};
                break;
            case 'sync-local-settings':
                Object.assign(localSettings.settings, msg.value.settings);
                msg.value.brands.forEach((brand) => {
                    const aBrand = localSettings.brands.find(b => b.key === brand.key);
                    aBrand && Object.assign(aBrand, brand);
                });
                settingsDrawerOpen.value = !selectedBrand().apiKey;
                break;
        }
    });
    settingsDrawerOpen.value = !selectedBrand().apiKey;
});

// watch(localSettings, (v) => {
//     console.log(v);
// });

const brandTabs = ref(null);

const selectedBrand = () => localSettings.brands.find((brand) => brand.selected) || localSettings.brands[0];
const selectedBrandKey = computed({
    get() {
        return selectedBrand().key;
    },
    set(key2set) {
        localSettings.brands.forEach(brand => brand.selected = brand.key === key2set);
    },
});

const storeLocalSettigns = () => {
    parent.postMessage({ pluginMessage: { key: 'store-local-settings', value: JSON.stringify(localSettings) } }, '*');
    settingsDrawerOpen.value = false;
};

const ozonCreativeData = ref(null);
watchEffect(async () => {
    const { externalCreativeId } = figmaPagePluginData.value || {};
    if (externalCreativeId) {
        try {
            console.log('+++ watchEffect externalCreativeId: %o', externalCreativeId);
            const api_response = await fetch(`${ api_endpoint_host }/api/external/creative/${ externalCreativeId }`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${ selectedBrand().apiKey }` },
            });
            if (api_response.status === 200) {
                const api_response_json = await api_response.json();
                ozonCreativeData.value = { ...api_response_json.creative };
                console.log('+++ watchEffect api_response: %o', api_response_json);
            } else {
                ozonCreativeData.value = null;
            }
        } catch (e) {
            ozonCreativeData.value = null;
        }
    } else {
        ozonCreativeData.value = null;
    }
});
provide('ozon-creative-data', {
    ozonCreativeData
});

</script>

<template>

    <el-container>
        <el-header>
            <el-row justify="space-between" align="middle">
                <el-col span="12">
                    <el-text type="primary" size="large">{{ selectedBrand().name }}</el-text>
                </el-col>
                <el-col span="2">
                    <el-button circle type="info" :icon="Setting" @click="settingsDrawerOpen = true"></el-button>
                </el-col>
            </el-row>
        </el-header>
        <el-main>
            <component :is="activeComponent" :api-key="selectedBrand().apiKey" :selection-infos="selectionInfos" :figma-page-href="figmaPageHref"></component>
        </el-main>
    </el-container>

    <el-drawer ref="settingsDrawer" v-model="settingsDrawerOpen" direction="ttb" append-to-body size="auto"
               :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false">
        <template #header>
            <el-text type="primary">Local settings</el-text>
        </template>
        <template #default>
            <el-tabs type="border-card" ref="brandTabs" v-model="selectedBrandKey">
                <el-tab-pane v-for="brand in localSettings.brands" :name="brand.key">
                    <template #label>
                        <span>{{ brand.name }}</span>
                        <el-icon v-if="brand.apiKey" class="iconic" style="vertical-align: middle" color="#67C23A"><CircleCheckFilled/></el-icon>
                        <el-icon v-else class="iconic" style="vertical-align: middle" color="#F56C6C"><WarningFilled/></el-icon>
                    </template>
                    <el-input v-model="brand.apiKey" type="textarea" autosize
                              placeholder="Paste API key here"></el-input>
                </el-tab-pane>
            </el-tabs>
        </template>
        <template #footer>
            <div style="flex: auto">
                <el-button :disabled="!selectedBrand().apiKey" type="primary" @click="storeLocalSettigns">OK</el-button>
            </div>
        </template>
    </el-drawer>

</template>

<style lang="less">
.el-drawer__header {
    margin-bottom: 0 !important;
}
</style>
<style scoped lang="less">
.el-header {
    height: auto;
}
.el-icon.iconic {
    margin-left: .33em;
}
</style>