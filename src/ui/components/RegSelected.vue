<script setup>
import { Setting } from "@element-plus/icons-vue";
</script>

<template>
    <el-container>
        <el-header>
            <el-row justify="space-between" align="middle">
                <el-col span="12">
                    <el-text type="primary" size="large">Heading</el-text>
                </el-col>
                <el-col span="2">
                    <el-button circle size="large" type="info" :icon="Setting"></el-button>
                </el-col>
            </el-row>
        </el-header>
        <el-main>
            MAIN
        </el-main>
    </el-container>
</template>

<style scoped lang="less">

</style>