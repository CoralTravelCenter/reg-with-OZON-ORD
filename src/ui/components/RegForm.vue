<script setup>

import { onMounted, reactive, ref, defineProps, watch, toRef, computed } from "vue";
import { callAPI } from "../../call-api";
import { find, groupBy } from "lodash";

const props = defineProps(['apiKey']);
const apiKey = toRef(props, 'apiKey');

const commonCreativeFields = reactive({
    title: '',
    isSocialAdv: false,
    isNative: false,
    isSelfPromotion: false,
    externalContractId: '',
    okvedCodes: ''
});

const commonFieldsRules = reactive({
    title: [
        { required: true, message: 'Придумайте назавнаие', trigger: 'blur' }
    ]
});

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
    organisations.value = organisations_list;
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
            key: group,
            label: { contract: 'Договор', addendum: 'Доп.соглашение' }[group],
            list: grouppedByContractType[group]
        });
    }
    return groupped;
});

const selectedContract = ref({});
const selectedOrganisation = ref({});


watch(apiKey, (val) => {
    console.log('+++ apiKey changed: %o', apiKey);
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
            <el-space size="large">
                <el-checkbox v-model="commonCreativeFields.isSocialAdv" label="Социальная реклама"></el-checkbox>
                <el-checkbox v-model="commonCreativeFields.isNative" label="Нативная реклама"></el-checkbox>
                <el-checkbox v-model="commonCreativeFields.isSelfPromotion" label="Самореклама"></el-checkbox>
            </el-space>
        </el-form-item>
        <el-row justify="space-between" gutter="20">
            <el-col :span="12">
                <el-form-item v-if="commonCreativeFields.isSelfPromotion" label="Контрагент саморекламы">
                    <el-select v-model="selectedOrganisation" value-key="externalOrganisationId" placeholder="Выберите">
                        <el-option v-for="org in organisations"
                                   :key="org.externalOrganisationId"
                                   :value="org"
                                   :label="org.fullOpf"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item v-else label="Договор или доп.соглашение">
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
                    <el-input v-model="commonCreativeFields.okvedCodes"></el-input>
                </el-form-item>
            </el-col>
        </el-row>
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
</style>