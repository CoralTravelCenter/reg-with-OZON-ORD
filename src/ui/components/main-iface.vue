<script setup>
import { ref, computed, onMounted } from 'vue';
import NoSuitableSelection from "./NoSuitableSelection.vue";
import RegSelected from "./RegSelected.vue";

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
        }
    });
});

</script>

<template>
    <component :is="activeComponent"></component>
</template>

<style lang="less">
</style>