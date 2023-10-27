<script setup>

import { onMounted, reactive, ref, defineProps, watch, toRef, computed, onUpdated, onUnmounted, inject, watchEffect } from "vue";
import { callAPI } from "../../call-api";
import { find, groupBy } from "lodash";
import { Plus, Delete, Link, WarningFilled } from '@element-plus/icons-vue';
import { api_endpoint_host } from "../../commons";
import moment from 'moment';

const props = defineProps(['apiKey']);
const apiKey = toRef(props, 'apiKey');
const { selectionInfos } = inject('selection-infos');
const openedCreativeNodeId = ref(selectionInfos.value[0].nodeId);
const registrationInProgress = ref(false);
const regFormDataProgress = reactive({ in_progress: false, value: 0, status: '' });

const regForm = ref(null);

const shareCreativeDescriptions = ref(true);

const commonCreativeFields = reactive({
    title: '',
    description: '',
    isSocialAdv: false,
    isNative: false,
    isSelfPromotion: false,
    externalContractId: '',
    externalOrganisationId: '',
    okvedCodes: ['79.12'],
    paymentType: 'PAYMENT_TYPE_OTHER',
    advObjectType: 'ADV_OBJECT_TYPE_BANNER',
    hasTargetLink: false,
    targetLinks: [''],
    sharedCreativeDescription: '',
    creativeInfos: [],
});
const commonFieldsRules = reactive({
    title: [{ required: true, message: 'Придумайте назавнаие', trigger: 'blur' }],
    description: [{ required: true, message: 'Опишите креатив', trigger: 'blur' }],
    externalContractId: [{ required: true, message: 'Необходимо выбрать из списка', trigger: 'change' }],
    externalOrganisationId: [{ required: true, message: 'Необходимо выбрать из списка', trigger: 'change' }],
    paymentType: [{ required: true, message: 'Необходимо выбрать из списка', trigger: 'change' }],
    advObjectType: [{ required: true, message: 'Необходимо выбрать из списка', trigger: 'change' }],
    targetLinks: [{
        required: true,
        type:     'array',
        defaultField: { type: 'string', required: true, message: 'Заполните все поля и/или удалите лишние',  trigger: 'change' },
        message: 'Заполните все поля и/или удалите лишние',
        trigger: 'change'
    }],
    sharedCreativeDescription: [{ required: true, message: 'Опишите креатив', trigger: 'blur' }],
});
const paymentTypes = [
    { type: 'PAYMENT_TYPE_CPM', label: 'CPM' },
    { type: 'PAYMENT_TYPE_CPC', label: 'CPC' },
    { type: 'PAYMENT_TYPE_CPA', label: 'CPA' },
    { type: 'PAYMENT_TYPE_OTHER', label: 'Другой' },
];

const advObjectTypes = [
    { type: 'ADV_OBJECT_TYPE_BANNER', label: 'Баннер' },
    { type: 'ADV_OBJECT_TYPE_TEXT_BLOCK', label: 'Текстовый или текстово-графический блок' },
    { type: 'ADV_OBJECT_TYPE_VIDEO', label: 'Видеоролик' },
    { type: 'ADV_OBJECT_TYPE_TEXT_GRAPHIC_BLOCK', label: 'Текстово-графический блок' },
    { type: 'ADV_OBJECT_TYPE_LIVE_VIDEO', label: 'Видеотрансляция в прямом эфире' },
    { type: 'ADV_OBJECT_TYPE_LIVE_AUDIO', label: 'Аудиотрансляция в прямом эфире' },
    { type: 'ADV_OBJECT_TYPE_AUDIO_REC', label: 'Аудиозапись' },
    { type: 'ADV_OBJECT_TYPE_OTHER', label: 'Другая' },
];

const selectedContract = ref({});
const selectedOrganisation = ref({});
const selectedPaymentType = ref(paymentTypes[3]);
const selectedAdvObjectType = ref(advObjectTypes[0]);

watch(selectedContract, newSelectedContract => commonCreativeFields.externalContractId = newSelectedContract.externalContractId);
watch(selectedOrganisation, newSelectedOrganisation => commonCreativeFields.externalOrganisationId = newSelectedOrganisation.externalOrganisationId);
watch(selectedPaymentType, newPaymentType => commonCreativeFields.paymentType = newPaymentType.type);
watch(selectedAdvObjectType, newValue => commonCreativeFields.advObjectType = newValue.type);
watch(selectionInfos, (infos) => {
    openedCreativeNodeId.value = infos[0].nodeId;
    commonCreativeFields.creativeInfos = infos.map(info => {
        return { nodeId: info.nodeId, description: '', dataUrl: '', bytes: '', name: info.nodeName, pluginData: JSON.parse(info.pluginData || '{}') };
    });
    console.log('*** watching selectionInfos: creativeInfos: %o',  commonCreativeFields.creativeInfos);
}, { immediate: true });


async function
fetchRefenceDatas() {
    const [{ contract: contracts_list }, { organisation: organisations_list }] = await Promise.all([
        callAPI(apiKey.value, '/api/external/contract/list', 'POST'),
        callAPI(apiKey.value, '/api/external/organisation/list', 'POST')
    ]);
    contracts.value = contracts_list.map((contract) => {
        return {
            ...contract,
            customerFullOpf: find(organisations_list, { externalOrganisationId: contract.externalOrganisationCustomerId }).fullOpf,
            performerFullOpf: find(organisations_list, { externalOrganisationId: contract.externalOrganisationPerformerId }).fullOpf
        }
    });
    selectedContract.value = {};
    organisations.value = organisations_list;
    selectedOrganisation.value = {};
}

const contracts = ref([]);
const organisations = ref([]);

const contractsGroupped = computed(() => {
    const grouppedByContractType = groupBy(contracts.value, (contract) => {
        return contract.contractType === 'CONTRACT_TYPE_ADDITIONAL_AGREEMENT' ? 'addendum' : 'contract';
    });
    const groupped = [];
    for (let group in grouppedByContractType) {
        groupped.push({
            key:   group,
            label: { contract: 'Договор', addendum: 'Доп.соглашение' }[group],
            list:  grouppedByContractType[group]
        });
    }
    return groupped;
});

const loadingOKVEDRefence = ref(false);
const okved = ref([]);
async function queryOKVEDRefence(query = '') {
    if (query.length >= 2) {
        loadingOKVEDRefence.value = true;
        const okved_all = await callAPI(apiKey.value, '/api/external/dict/okved', 'POST', {}, { Accept: 'application/json' });
        const query_words = query.toUpperCase().split(/\s+/);
        okved.value = okved_all.filter((okved_item) => {
            if (okved_item.code.indexOf(query) === 0) {
                return true;
            } else {
                const okved_name_words = okved_item.name.toUpperCase().split(/\s+/);
                return query_words.every(query_word => okved_name_words.some(word => word.indexOf(query_word) === 0));
            }
        });
        loadingOKVEDRefence.value = false;
    }
}

watch(apiKey, () => {
    fetchRefenceDatas();
});

async function windowMessageHandler({ data: { pluginMessage: msg } }) {
    switch (msg.key) {
        case 'node-render-data-url':
            // console.log(msg.value);
            const based64 = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(new Blob([msg.value.rendered]));
            });
            const dataUrl = 'data:image/png;base64' + based64.slice(based64.indexOf(','));
            // console.log(dataUrl);
            const cInfo = find(commonCreativeFields.creativeInfos, { nodeId: msg.value.nodeId });
            if (cInfo) {
                cInfo.bytes = msg.value.rendered;
                cInfo.dataUrl = dataUrl;
            }
            break;
    }
}

onMounted(() => {
    fetchRefenceDatas();
    parent.postMessage({ pluginMessage: { key: 'resize-ui', value: { height: document.documentElement.scrollHeight } } }, '*');
    window.addEventListener('message', windowMessageHandler);
    parent.postMessage({ pluginMessage: { key: 'inform-about-selection' } }, '*');
});
onUnmounted(() => {
    window.removeEventListener('message', windowMessageHandler);
});

onUpdated(() => {
    parent.postMessage({ pluginMessage: { key: 'resize-ui', value: { height: document.documentElement.scrollHeight } } }, '*');
});

const { ozonCreativeData } = inject('ozon-creative-data');
watch([ozonCreativeData, organisations, contracts], ([newOzonCreativeData, newOrganisations, newContracts]) => {
    commonCreativeFields.title = newOzonCreativeData?.title || '';
    commonCreativeFields.description = newOzonCreativeData?.description || '';
    commonCreativeFields.isSocialAdv = newOzonCreativeData?.isSocialAdv || false;
    commonCreativeFields.isNative = newOzonCreativeData?.isNative || false;
    commonCreativeFields.isSelfPromotion = !!(newOzonCreativeData?.selfPromotionExternalOrganizationId);
    if (commonCreativeFields.isSelfPromotion) {
        selectedOrganisation.value = find(newOrganisations, { externalOrganisationId: newOzonCreativeData?.selfPromotionExternalOrganizationId });
    } else {
        selectedContract.value = find(newContracts, { externalContractId: newOzonCreativeData?.externalContractId });
    }
    commonCreativeFields.okvedCodes = newOzonCreativeData?.okvedCodes || [];
    selectedPaymentType.value = find(paymentTypes, { type: newOzonCreativeData?.paymentType });
    selectedAdvObjectType.value = find(advObjectTypes, { type: newOzonCreativeData?.advObjectType });
    // urlList
    if (newOzonCreativeData?.urlList?.length > 0) {
        commonCreativeFields.hasTargetLink = true;
        commonCreativeFields.targetLinks = newOzonCreativeData.urlList.map(link => link.url);
    } else {
        commonCreativeFields.hasTargetLink = false;
        commonCreativeFields.targetLinks = [];
    }
    // mediaData
    // crativeInfo: { nodeId, description, dataUrl, bytes, name, pluginData: { ozonFileId } }
    const all_creatives_were_registered = commonCreativeFields.creativeInfos.every(info => {
        return !!newOzonCreativeData.mediaData.find(media => media.file.id === info.pluginData.ozonFileId);
    });
    const media_descriptions = newOzonCreativeData.mediaData.map(media => media.description);
    const all_media_descriptions_are_the_same = new Set(media_descriptions).size === 1;
    // commonCreativeFields.sharedCreativeDescription = all_media_descriptions_are_the_same;


});

const ozonCreative_createdAt = computed(() => {
    return ozonCreativeData.value && moment(ozonCreativeData.value.createdAt).format('YYYY-MM-DD');
});
const ozonCreative_editedAt = computed(() => {
    return ozonCreativeData.value && moment(ozonCreativeData.value.editedAt).format('YYYY-MM-DD');
});

async function letsRegister() {
    try {
        await regForm.value.validate();
        registrationInProgress.value = true;
        await Promise.all(commonCreativeFields.creativeInfos.map(creative => {
            return new Promise(resolve => {
                creative.progress = {
                    in_progress: true,
                    value: 100,
                    status: ''
                };
                const form_data = new FormData();
                form_data.append('file', new Blob([creative.bytes]));
                fetch(`${ api_endpoint_host }/api/external/file/media`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${ apiKey.value }` },
                    body: form_data
                }).then(response => {
                    response.json().then(json => {
                        console.log("+++ /api/external/file/media: %o", json);
                        creative.progress.in_progress = false;
                        creative.progress.status = 'success';
                        creative.ozonFileId = json.id;
                        resolve(json.id);
                    });
                });
            });
        }));

        const creativeRegData = {};

        // creativeRegData.externalCreativeId = props.figmaPageHref;

        if (commonCreativeFields.isSelfPromotion) {
            creativeRegData.selfPromotionExternalOrganizationId = commonCreativeFields.externalOrganisationId;
        } else {
            creativeRegData.externalContractId = commonCreativeFields.externalContractId;
        }
        creativeRegData.advObjectType = commonCreativeFields.advObjectType;
        creativeRegData.title = commonCreativeFields.title;
        creativeRegData.description = commonCreativeFields.description;
        // geoTargets ???
        if (commonCreativeFields.isSocialAdv) creativeRegData.isSocialAdv = commonCreativeFields.isSocialAdv;
        if (commonCreativeFields.isNative) creativeRegData.isNative = commonCreativeFields.isNative;
        creativeRegData.mediaData = commonCreativeFields.creativeInfos.map(creative => {
            return {
                description: shareCreativeDescriptions.value ? commonCreativeFields.sharedCreativeDescription : creative.description,
                file: { id: creative.ozonFileId }
            };
        });
        creativeRegData.okvedCodes = commonCreativeFields.okvedCodes;
        creativeRegData.paymentType = commonCreativeFields.paymentType;
        // targetLink
        // urlList
        if (commonCreativeFields.hasTargetLink) {
            const links = Array.from(commonCreativeFields.targetLinks);
            // creativeRegData.targetLink = links.shift();
            if (links.length > 0) {
                creativeRegData.urlList = links.map(link => ({ url: link }));
            }
        }

        console.log('+++ creativeRegData: %o', creativeRegData);

        regFormDataProgress.in_progress = true;
        regFormDataProgress.value = 100;
        const reg_response = await callAPI(apiKey.value, '/api/external/creative', 'POST', creativeRegData);
        regFormDataProgress.in_progress = false;
        regFormDataProgress.status = 'success';

        console.log('+++ reg_response: %o', reg_response);

    } catch (ex) {}
}

</script>

<template>
    <el-card v-if="ozonCreativeData" class="reg-info">
        <template #header>
            <div class="reg-info-card-header">
                <el-link :icon="Link" type="success" :href="`https://ord.ozon.ru/creatives/${ ozonCreativeData.creativeId }`">Зарегистрирован</el-link>
                <el-popconfirm title="Are you sure?"
                               width="200"
                               hide-after="0"
                               confirm-button-text="Absolutely!"
                               confirm-button-type="warning"
                               cancel-button-text="Not yet"
                               :icon="WarningFilled">
                    <template #reference>
                        <el-button plain type="warning">Forget</el-button>
                    </template>
                </el-popconfirm>
            </div>
        </template>
        <el-descriptions size="small" border>
            <el-descriptions-item align="center">
                <template #label>Маркер</template>
                <el-text type="success">{{ ozonCreativeData.marker }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item align="center">
                <template #label>Создан</template>
                <el-text type="info">{{ ozonCreative_createdAt }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item align="center">
                <template #label>Изменен</template>
                <el-text type="info">{{ ozonCreative_editedAt }}</el-text>
            </el-descriptions-item>
        </el-descriptions>
    </el-card>
    <el-form ref="regForm"
             label-position="top" size="small" status-icon :model="commonCreativeFields"
             :rules="commonFieldsRules"
             @submit.prevent>
        <el-form-item label="Название креатива" prop="title">
            <el-input v-model="commonCreativeFields.title"></el-input>
        </el-form-item>
        <el-form-item label="Общее описание объекта рекламирования" prop="description">
            <el-input v-model="commonCreativeFields.description" type="textarea" :autosize="{ minRows: 3 }"
            placeholder="Укажите: &#10- Бренд (или несколько брендов) рекламируемых товаров или услуг; &#10- Вид товара/услуги; &#10- Дополнительную информацию."></el-input>
        </el-form-item>
        <el-form-item>
            <el-space size="large" alignment="center">
                <el-switch v-model="commonCreativeFields.isSelfPromotion" active-text="Самореклама"></el-switch>
                <el-checkbox v-model="commonCreativeFields.isSocialAdv" label="Социальная реклама"></el-checkbox>
                <el-checkbox v-model="commonCreativeFields.isNative" label="Нативная реклама"></el-checkbox>
            </el-space>
        </el-form-item>
        <el-row justify="space-between" gutter="20">
            <el-col :span="12">
                <el-form-item v-if="commonCreativeFields.isSelfPromotion" prop="externalOrganisationId" label="Контрагент саморекламы">
                    <el-select v-model="selectedOrganisation" value-key="externalOrganisationId" placeholder="Выберите">
                        <el-option v-for="org in organisations"
                                   :key="org.externalOrganisationId"
                                   :value="org"
                                   :label="org.fullOpf"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item v-else prop="externalContractId" label="Договор или доп.соглашение">
                    <el-select v-model="selectedContract" value-key="externalContractId" placeholder="Выберите">
                        <el-option-group v-for="group in contractsGroupped" :key="group.key" :label="group.label">
                            <el-option v-for="contract in group.list" class="contract-item"
                                       :key="contract.externalContractId"
                                       :value="contract"
                                       :label="(contract.contractNumber || contract.additionalContractNumber) + ' от ' + (contract.contractDate || contract.additionalContractNumberDate)">
                                <el-row>
                                    <el-space spacer="от">
                                        <el-text>{{ contract.contractNumber || contract.additionalContractNumber }}</el-text>
                                        <el-text>{{ contract.contractDate || contract.additionalContractNumberDate }}</el-text>
                                    </el-space>
                                </el-row>
                                <el-row>
                                    <el-space spacer="&mdash;">
                                        <el-text>{{ contract.customerFullOpf }}</el-text>
                                        <el-text>{{ contract.performerFullOpf }}</el-text>
                                    </el-space>
                                </el-row>
                            </el-option>
                        </el-option-group>
                    </el-select>
                </el-form-item>
            </el-col>
            <el-col :span="12">
                <el-form-item label="Коды ОКВЭД">
                    <el-select v-model="commonCreativeFields.okvedCodes"
                               multiple filterable remote
                               :remote-method="queryOKVEDRefence"
                               :loading="loadingOKVEDRefence">
                        <el-option v-for="item in okved" :key="item.code" :value="item.code" :label="item.code">
                            {{ item.name }} ({{ item.code }})
                        </el-option>
                    </el-select>
                </el-form-item>
            </el-col>
        </el-row>
        <el-row justify="space-between" gutter="20">
            <el-col span="12" style="flex: 1">
                <el-form-item prop="paymentType" label="Тип оплаты рекламной кампании">
                    <el-select v-model="selectedPaymentType" value-key="type" placeholder="Выберите">
                        <el-option v-for="payment in paymentTypes"
                                   :key="payment.type"
                                   :label="payment.label"
                                   :value="payment"></el-option>
                    </el-select>
                </el-form-item>
            </el-col>
            <el-col span="12" style="flex: 1">
                <el-form-item prop="advObjectType" label="Форма распространения рекламы">
                    <el-select v-model="selectedAdvObjectType" value-key="type" placeholder="Выберите">
                        <el-option v-for="advObject in advObjectTypes"
                                   :key="advObject.type"
                                   :label="advObject.label"
                                   :value="advObject"></el-option>
                    </el-select>
                </el-form-item>
            </el-col>
        </el-row>
        <el-form-item>
            <el-switch v-model="commonCreativeFields.hasTargetLink" active-text="Целевые ссылки"></el-switch>
        </el-form-item>
        <el-form-item v-if="commonCreativeFields.hasTargetLink" prop="targetLinks">
            <div v-for="(link, idx) in commonCreativeFields.targetLinks" :key="idx" class="target-url-input">
                <el-input v-model="commonCreativeFields.targetLinks[idx]"></el-input>
                <el-button v-if="idx === (commonCreativeFields.targetLinks.length-1)" :icon="Plus"
                           @click="commonCreativeFields.targetLinks.push('')"></el-button>
                <el-button v-if="commonCreativeFields.targetLinks.length > 1" :icon="Delete"
                           @click="commonCreativeFields.targetLinks.splice(idx,1); regForm.validateField('targetLinks')"></el-button>
            </div>
        </el-form-item>
        <el-space size="large" alignment="center">
            <el-text>Данные о креативе</el-text>
            <el-checkbox v-model="shareCreativeDescriptions">Одинаковое описание для всех креативов</el-checkbox>
        </el-space>
        <el-collapse class="creative-files" v-model="openedCreativeNodeId" accordion style="flex: 1">
            <el-collapse-item v-for="(frameInfo, idx) in selectionInfos" :name="frameInfo.nodeId">
                <template #title>
                    {{ frameInfo.nodeName }}
                </template>
                <el-form-item v-if="shareCreativeDescriptions" prop="sharedCreativeDescription">
                    <div class="creative-body">
                        <el-image style="width: 150px; max-height: 150px;" fit="contain" :src="commonCreativeFields.creativeInfos[idx].dataUrl">
                            <template #placeholder>Rendering...</template>
                            <template #error>Rendering...</template>
                        </el-image>
                        <el-input v-model="commonCreativeFields.sharedCreativeDescription" type="textarea" rows="3" placeholder="Краткое описание изображения креатива"></el-input>
                    </div>
                </el-form-item>
                <el-form-item v-else
                              :prop="'creativeInfos.' + idx"
                              :rules="{
                                type: 'object',
                                fields: {
                                    text: { required: false },
                                    description: { required: true, trigger: 'blur' }
                                }
                              }">
                    <div class="creative-body">
                        <el-image style="width: 150px; max-height: 150px;" fit="contain" :src="commonCreativeFields.creativeInfos[idx].dataUrl">
                            <template #placeholder>Rendering...</template>
                            <template #error>Rendering...</template>
                        </el-image>
                        <el-input v-model="commonCreativeFields.creativeInfos[idx].description" type="textarea" rows="3" placeholder="Краткое описание изображения креатива"></el-input>
                    </div>
                </el-form-item>
            </el-collapse-item>
        </el-collapse>
        <div class="submit-ctl">
            <el-button plain size="default"
                       :type="ozonCreativeData ? 'warning' : 'primary'"
                       @click="letsRegister">{{ ozonCreativeData ? 'Обновить' : 'Зарегистрировать' }}</el-button>
        </div>
    </el-form>

    <el-drawer v-model="registrationInProgress"
               direction="btt" size="auto" append-to-body
               :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false">
        <template #header>
            <el-text>Регистрируем креатив...</el-text>
        </template>
        <el-divider content-position="left">Загрузка файлов</el-divider>
        <el-space direction="vertical" alignment="stretch" style="width: 100%;">
            <el-progress v-for="creative in commonCreativeFields.creativeInfos"
                         :stroke-width="15" :duration="2"
                         :indeterminate="creative.progress?.in_progress"
                         :text-inside="creative.progress?.in_progress"
                         :percentage="creative.progress?.value"
                         :status="creative.progress?.status"
                         :format="() => creative.name"></el-progress>
        </el-space>
        <el-divider content-position="left">Отправка данных</el-divider>
        <el-progress :indeterminate="regFormDataProgress.in_progress"
                     :percentage="regFormDataProgress.value"
                     :status="regFormDataProgress.status"></el-progress>
    </el-drawer>

</template>

<style scoped lang="less">

.el-collapse.creative-files {
    :deep(.el-collapse-item__content) {
        padding-bottom: 0;
    }
}

.el-card.reg-info {
    margin-bottom: 20px;
    :deep(.el-card__header) {
        padding: calc(var(--el-card-padding) - 15px) calc(var(--el-card-padding) - 7px);
    }
}
.reg-info-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.creative-body {
    width: 100%;
    display: grid;
    grid-gap: 0 15px;
    grid-template-columns: 150px 1fr;
    .el-image {
        grid-row: span 2;
        filter: drop-shadow(0px 2px 2px fade(black, 50%));
    }
}

.el-select {
    flex: 1;
}
.el-select-dropdown__item.contract-item {
    height: unset;
    line-height: unset;
}

.target-url-input {
    width: 100%;
    display: flex;
    gap: 10px;
    >* {
        margin: 0;
    }
    >*:nth-child(1) {
        flex: 1;
    }
    & + .target-url-input {
        margin-top: 10px;
    }
}

.submit-ctl {
    display: flex;
    justify-content: center;
    padding-top: 1em;
}

</style>

<style lang="less">
.el-popper {
    max-width: 98%;
}
</style>