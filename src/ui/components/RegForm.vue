<script setup>

import { onMounted, reactive, ref } from "vue";


const apiKey = ref("eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MjU1Mjg0NDEsImp0aSI6IjQ5OCIsImlhdCI6MTY5Mzk5MjQ0MSwiaXNzIjoiNDMxMCIsInN1YiI6IjI3NTYifQ.km5Eqre0ITzv5ZMLHb8oHRYj9JQZEwsyGtmw5y4dH24_PNhzG4TDjQGQPWA8gZKN7za0046GEtVnrCezY_VX2g");

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
    parent.postMessage({
        pluginMessage: {
            key: 'fetch',
            value: {
                // url: 'https://ord.ozon.ru/api/external/contract/list',
                url: 'http:/localhost:8010/proxy/api/external/contract/list',
                init: {
                    method:  'POST',
                    headers: {
                        Authorization: `Bearer ${ apiKey.value }`
                    },
                    body: JSON.stringify({
                        // externalContractIds:  ['1044020'],
                        // gtExternalContractId: '',
                        // pageSize: 2500
                    })
                }
            }
        }
    }, '*');
    parent.postMessage({
        pluginMessage: {
            key: 'fetch',
            value: {
                // url: 'https://ord.ozon.ru/api/external/organization/list',
                url: 'http:/localhost:8010/proxy/api/external/organisation/list',
                init: {
                    method:  'POST',
                    headers: {
                        Authorization: `Bearer ${ apiKey.value }`
                    },
                    body: JSON.stringify({})
                }
            }
        }
    }, '*');
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