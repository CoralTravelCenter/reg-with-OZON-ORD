import { figmaClientStorageKey, figmaComponentPluginDataKey, figmaPagePluginDataKey } from "../commons";
import { listenForAPIRequests } from "../call-api";

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
    }
};

informUIAboutSelection();

//======================================================================================================================
function informUIAboutSelection() {
    // const currentSelection = Array.from(figma.currentPage.selection);
    if (figma.currentPage.children.length > 0 && figma.currentPage.children.every(node => node.type === 'COMPONENT')) {
        const selectionInfos = figma.currentPage.children.map((node) => {
            node.exportAsync({ format: 'PNG' }).then((rendered) => {
                figma.ui.postMessage({ key: 'node-render-data-url', value: { nodeId: node.id, rendered } });
            });
            return {
                nodeId: node.id,
                nodeName: node.name,
                markerPlaceholderId: node.findOne(n => n.name === '#marker')?.id,
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
        // pagePluginData = {
            // externalCreativeId: 'https://www.figma.com/file/lsD8djF5Ux3XSokfkx4aQj/ORD?type=design&node-id=0-1&mode=design',
            // externalCreativeId: 'ozon-auto-generated-uuid'
        // };
    } catch (ex) {
    }
    return pagePluginData;
}