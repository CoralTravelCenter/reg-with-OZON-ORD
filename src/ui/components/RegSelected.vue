<script setup>
import { ref, defineProps } from "vue";
import RegForm from "./RegForm.vue";

const props = defineProps(['apiKey', 'selectionInfos', 'figmaPageHref']);

</script>

<template>
    <reg-form :api-key="props.apiKey" :selection-infos="props.selectionInfos" :figma-page-href="figmaPageHref"></reg-form>
</template>

<style scoped lang="less">

</style>