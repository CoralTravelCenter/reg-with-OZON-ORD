<script setup>
// data
const title = "lets make some rect(s)";
let count = 5;

// methods
const create = () => {
    window.parent.postMessage({ pluginMessage: { type: "create-rectangles", count } }, "*")
}
const cancel = () => {
    window.parent.postMessage({ pluginMessage: { type: "cancel" } }, "*")
}
</script>

<template>
    <h2>{{ title }}</h2>
    <p>How many? <input id="count" v-model="count"></p>
    <button id="create" @click="create()">Create</button>
    <button id="cancel" @click="cancel()">Cancel</button>
</template>

<style lang="less">

</style>
