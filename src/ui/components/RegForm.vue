<script setup>

import { onMounted, reactive, ref, defineProps } from "vue";
import { callAPI } from "../../call-api";

const props = defineProps(['apiKey']);

const commonCreativeFields = reactive({
    creativeName: '',
    contractOrAddendum: '',
    OKVED: ''
});

const commonFieldsRules = reactive({
    creativeName: [
        { required: true, message: 'Придумайте назавнаие', trigger: 'blur' }
    ]
});

onMounted(() => {
    callAPI(props.apiKey, '/api/external/organisation/list', 'POST').then((response_json) => {
        console.log('+++ organisations: %o', response_json);
    });
    callAPI(props.apiKey, '/api/external/contract/list', 'POST').then((response_json) => {
        console.log('+++ contracts: %o', response_json);
    });
});

</script>

<template>
    <el-form label-position="top"
             :model="commonCreativeFields"
             size="small"
             :rules="commonFieldsRules"
             status-icon>
        <el-form-item label="Название креатива" prop="creativeName">
            <el-input v-model="commonCreativeFields.creativeName"></el-input>
        </el-form-item>
        <el-row justify="space-between">
            <el-col :span="11">
                <el-form-item label="Договор или доп.соглашение">
                    <el-input v-model="commonCreativeFields.contractOrAddendum"></el-input>
                </el-form-item>
            </el-col>
            <el-col :span="11">
                <el-form-item label="Коды ОКВЭД">
                    <el-input v-model="commonCreativeFields.OKVED"></el-input>
                </el-form-item>
            </el-col>
        </el-row>
    </el-form>
</template>

<style scoped lang="less">

</style>