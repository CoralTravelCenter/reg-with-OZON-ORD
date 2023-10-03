<script setup>
import { ref, defineProps } from "vue";
import RegForm from "./RegForm.vue";

const props = defineProps(['apiKey', 'selectionInfos']);

</script>

<template>
    <reg-form :api-key="props.apiKey" :selection-infos="props.selectionInfos"></reg-form>
</template>

<style scoped lang="less">

</style>