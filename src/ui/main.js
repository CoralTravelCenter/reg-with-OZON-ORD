import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import ui from './ui.vue';

const app = createApp(ui);
app.use(ElementPlus);
app.mount('#ui');
