<script setup>
import { ref, defineProps } from "vue";
import RegForm from "./RegForm.vue";

const props = defineProps(['apiKey', 'figmaPageHref']);

</script>

<template>
    <reg-form :api-key="props.apiKey" :figma-page-href="figmaPageHref"></reg-form>
</template>

<style scoped lang="less">

</style>