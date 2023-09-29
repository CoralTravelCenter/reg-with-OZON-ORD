<script setup>

import { onMounted, reactive, ref, defineProps, watch, toRef, computed } from "vue";
import { callAPI } from "../../call-api";
import { find, groupBy } from "lodash";
import { Plus, Delete } from '@element-plus/icons-vue';

const props = defineProps(['apiKey']);
const apiKey = toRef(props, 'apiKey');

const commonCreativeFields = reactive({
    title: '',
    isSocialAdv: false,
    isNative: false,
    isSelfPromotion: false,
    externalContractId: '',
    externalOrganisationId: '',
    okvedCodes: ['79.12'],
    paymentType: '',
    advObjectType: 'ADV_OBJECT_TYPE_BANNER',
    hasTargetLink: false,
    targetLinks: ['']
});
const commonFieldsRules = reactive({
    title: [{ required: true, message: 'Придумайте назавнаие', trigger: 'blur' }],
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
const selectedPaymentType = ref({});
const selectedAdvObjectType = ref(advObjectTypes[0]);

watch(selectedContract, newSelectedContract => commonCreativeFields.externalContractId = newSelectedContract.externalContractId);
watch(selectedOrganisation, newSelectedOrganisation => commonCreativeFields.externalOrganisationId = newSelectedOrganisation.externalOrganisationId);
watch(selectedPaymentType, newPaymentType => commonCreativeFields.paymentType = newPaymentType.type);
watch(selectedAdvObjectType, newValue => commonCreativeFields.advObjectType = newValue.type);


async function fetchRefenceDatas() {
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



watch(apiKey, (val) => {
    fetchRefenceDatas();
});

onMounted(() => {
    fetchRefenceDatas();
});

</script>

<template>
    <el-form label-position="top"
             :model="commonCreativeFields"
             size="small"
             :rules="commonFieldsRules"
             status-icon>
        <el-form-item in label="Название креатива" prop="title">
            <el-input v-model="commonCreativeFields.title"></el-input>
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
                           @click="commonCreativeFields.targetLinks.splice(idx,1)"></el-button>
            </div>
        </el-form-item>
    </el-form>
</template>

<style scoped lang="less">
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

</style>

<style lang="less">
.el-popper {
    max-width: 98%;
}
</style>