<script setup>
import { ref, watch, reactive, computed, onMounted } from 'vue';
import NoSuitableSelection from "./NoSuitableSelection.vue";
import RegSelected from "./RegSelected.vue";
import { Setting, WarningFilled, CircleCheckFilled } from "@element-plus/icons-vue";


const localSettings = reactive({
    brands: [
        { key: 'coral', name: 'Coral Travel', apiKey: null, selected: true },
        { key: 'sunmar', name: 'Sunmar', apiKey: null },
    ],
    settings: {}
});

const settingsDrawer = ref(true);

const hasValidSelection = ref(false);

let activeComponent = computed(() => {
    return hasValidSelection.value ? RegSelected : NoSuitableSelection;
});

onMounted(() => {
    console.log('+++ MainIface mounted');
    window.addEventListener('message', ({ data: { pluginMessage: msg } }) => {
        switch (msg.key) {
            case 'valid-selection':
                console.log('+++ VALID SELECTION: %o', msg.value);
                hasValidSelection.value = true;
                break;
            case 'invalid-selection':
                console.log('+++ INVALID SELECTION');
                hasValidSelection.value = false;
                break;
            case 'sync-local-settings':
                console.log('+++ update-local-settings: %o', msg.value);
                break;
        }
    });
});

watch(localSettings, (v) => {
    // console.log(v);
});

const closingSettingsDrawer = (done) => {
    done(false);
};

const brandTabs = ref(null);

const selectedBrand = computed(() => localSettings.brands.find((brand) => brand.selected) || localSettings.brands[0]);
const selectedBrandKey = computed({
    get() {
        return localSettings.brands.find(brand => brand.selected)?.key || localSettings.brands[0].key;
    },
    set(key2set) {
        localSettings.brands.forEach(brand => {
            if (brand.key === key2set) {
                brand.selected = true;
            } else {
                delete brand.selected;
            }
        });
    },
});

</script>

<template>

    <el-container>
        <el-header>
            <el-row justify="space-between" align="middle">
                <el-col span="12">
                    <el-text type="primary" size="large">Heading</el-text>
                </el-col>
                <el-col span="2">
                    <el-button circle type="info" :icon="Setting"></el-button>
                </el-col>
            </el-row>
        </el-header>
        <el-main>
            <component :is="activeComponent"></component>
        </el-main>
    </el-container>

    <el-drawer v-model="settingsDrawer" direction="ttb" append-to-body size="auto" :before-close="closingSettingsDrawer">
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
                <el-button>Cancel</el-button>
                <el-button type="primary">OK</el-button>
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
.el-icon.iconic {
    margin-left: .33em;
}
</style>