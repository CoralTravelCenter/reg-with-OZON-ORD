export const figmaClientStorageKey = 'SETTINGS';
export const figmaPagePluginDataKey = 'ozon-creative-data';
export const figmaComponentPluginDataKey = 'ozon-media-data';

// export const api_endpoint_host = 'https://touroperator.coral.ru/corsproxy/ord.ozon.ru';
export const api_endpoint_host = 'http://localhost:8010/proxy';
// export const api_endpoint_host = 'https://ord.ozon.ru';

export function setNodeMediaData(node_or_id, data2set = {}) {
    const node = typeof node_or_id === 'string' ? figma.getNodeById(node_or_id) : node_or_id;
    if (node) {
        let plugin_data = {};
        if (data2set !== '') {
            if (typeof data2set === 'string') data2set = JSON.parse(data2set);
            try {
                plugin_data = JSON.parse(node.getPluginData(figmaComponentPluginDataKey));
            } catch (e) {}
            node.setPluginData(figmaComponentPluginDataKey, JSON.stringify({...plugin_data, ...data2set}));
        } else {
            node.setPluginData(figmaComponentPluginDataKey, '');
        }
    }
}

export function clearNodeMediaData(node_or_id) {
    setNodeMediaData(node_or_id, '');
}

export function legalLabel(customer_name, erid) {
    return `Реклама. ${ customer_name }. ${ erid }`;
}