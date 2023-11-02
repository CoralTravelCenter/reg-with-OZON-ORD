import {
    figmaClientStorageKey,
    figmaComponentPluginDataKey,
    figmaPagePluginDataKey,
    setNodeMediaData,
    clearNodeMediaData, legalMarkerPlaceholderName, figmaDefaultFontName
} from "../commons";
import { listenForAPIRequests } from "../call-api";
import { isMatchWith } from "lodash";

figma.showUI(__html__, { width: 600, height: 600 });

figma.clientStorage.getAsync(figmaClientStorageKey).then((something) => {
    if (something) {
        figma.ui.postMessage({ key: 'sync-local-settings', value: something });
    }
});

listenForAPIRequests();

figma.on('selectionchange', informUIAboutSelection);
figma.on('currentpagechange', informUIAboutSelection);

figma.ui.onmessage = (msg) => {
    switch (msg.key) {
        case 'store-local-settings':
            figma.clientStorage.setAsync(figmaClientStorageKey, JSON.parse(msg.value)).then(() => {
                console.log('+++ store-local-settings: stored: %o', msg.value)
            });
            break;
        case 'inform-about-selection':
            informUIAboutSelection();
            break;
        case 'resize-ui':
            const { width = 600, height = 600 } = msg.value;
            figma.ui.resize(width, height);
            break;
        case 'store-page-plugin-data':
            const plugin_data = typeof msg.value === 'string' ? msg.value : JSON.stringify(msg.value);
            figma.currentPage.setPluginData(figmaPagePluginDataKey, plugin_data);
            break;
        case 'store-node-plugin-data':
            const { nodeId, pluginData } = typeof msg.value === 'object' ? msg.value : JSON.parse(msg.value);
            setNodeMediaData(nodeId, pluginData);
            const node = figma.getNodeById(nodeId);
            node && node.setPluginData('figma-node-id', node.id);
            break;
        case 'store-node-plugin-data-with-predicate':
            const { lookupPrdicate, data2set } = typeof msg.value === 'object' ? msg.value : JSON.parse(msg.value);
            const node2update = figma.currentPage.children.find(node => {
                let pluginData = {};
                try {
                    pluginData = JSON.parse(node.getPluginData(figmaComponentPluginDataKey));
                } catch (e) {}
                return isMatchWith(pluginData, lookupPrdicate, (dataVal, lookupVal, key) => {
                    if (key === 'ozonFileId') {
                        return String(dataVal) === String(lookupVal);
                    }
                });
            });
            node2update && setNodeMediaData(node2update, data2set);
            break;
        case 'forget-registration':
            figma.currentPage.children.forEach(node => {
                clearNodeMediaData(node);
                node.setPluginData('figma-node-id', '');
            });
            figma.currentPage.setPluginData(figmaPagePluginDataKey, '');
            informUIAboutSelection();
            break;
        case 'apply-legal-labels':
            try {
                applyLegalLabels(msg.value);
            } catch (ex) {
                console.log('!!!!!!!!!!!', ex);
            }
            break;
    }
};

informUIAboutSelection();

//======================================================================================================================

async function applyLegalLabels(label) {
    for (const node of figma.currentPage.children) {
        let marker_placeholder = node.findOne(n => n.name === legalMarkerPlaceholderName);
        const placeholder_found = !!marker_placeholder;
        if (!placeholder_found) {
            marker_placeholder = figma.createText();
            await figma.loadFontAsync(figmaDefaultFontName);
        } else {
            try {
                await Promise.all(marker_placeholder.getRangeAllFontNames(0, marker_placeholder.characters.length).map(figma.loadFontAsync));
            } catch (ex){
                await figma.loadFontAsync(figmaDefaultFontName);
            }
        }
        marker_placeholder.autoRename = false;
        marker_placeholder.characters = label;
        if (!placeholder_found) {
            marker_placeholder.name = legalMarkerPlaceholderName;
            node.appendChild(marker_placeholder);
            marker_placeholder.x = (node.width - marker_placeholder.width) / 2;
            marker_placeholder.y = node.height - 3 * marker_placeholder.height;
        }
    }
}

function trackNodesPluginData() {
    figma.currentPage.children.forEach(node => {
        const trackedNodeId = node.getPluginData('figma-node-id');
        if (node.id !== trackedNodeId) {
            clearNodeMediaData(node);
        }
    });
}

function informUIAboutSelection() {
    if (figma.currentPage.children.length > 0 && figma.currentPage.children.every(node => node.type === 'COMPONENT')) {
        trackNodesPluginData();
        const selectionInfos = figma.currentPage.children.map(node => {
            node.exportAsync({ format: 'PNG' }).then(rendered => {
                figma.ui.postMessage({ key: 'node-render-data-url', value: { nodeId: node.id, rendered } });
            });
            return {
                nodeId: node.id,
                nodeName: node.name,
                markerPlaceholderId: node.findOne(n => n.name === legalMarkerPlaceholderName)?.id,
                pluginData: node.getPluginData(figmaComponentPluginDataKey)
            };
        });
        const page_href = `https://www.figma.com/file/${ figma.fileKey }/${ figma.root.name }?type=design&node-id=${ figma.currentPage.id.split(':').join('-') }&mode=design`;
        figma.ui.postMessage({
            key: 'valid-selection',
            value: selectionInfos,
            figmaPageHref: page_href,
            pagePluginData: getPagePluginData()
        });
    } else {
        figma.ui.postMessage({ key: 'invalid-selection' });
    }
}

function getPagePluginData() {
    let pagePluginData;
    try {
        pagePluginData = JSON.parse(figma.currentPage.getPluginData(figmaPagePluginDataKey));
    } catch (ex) {
    }
    return pagePluginData;
}