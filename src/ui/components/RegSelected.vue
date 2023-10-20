<script setup>
import { ref, defineProps } from "vue";
import RegForm from "./RegForm.vue";

const props = defineProps(['apiKey']);

</script>

<template>
    <reg-form :api-key="props.apiKey"></reg-form>
</template>

<style scoped lang="less">

</style>