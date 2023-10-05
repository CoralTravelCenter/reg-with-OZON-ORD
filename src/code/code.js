import { figmaClientStorageKey } from "../commons";
import { listenForAPIRequests } from "../call-api";

figma.showUI(__html__, { width: 600, height: 600 });

figma.clientStorage.getAsync(figmaClientStorageKey).then((something) => {
    if (something) {
        figma.ui.postMessage({ key: 'sync-local-settings', value: something });
    }
});

listenForAPIRequests();

figma.on('selectionchange', informUIAboutSelection);

figma.ui.onmessage = (msg) => {
    switch (msg.key) {
        case 'store-local-settings':
            figma.clientStorage.setAsync(figmaClientStorageKey, JSON.parse(msg.value)).then(() => {
                console.log('+++ store-local-settings: stored: %o', msg.value)
            });
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
    const currentSelection = Array.from(figma.currentPage.selection);
    if (currentSelection.length && currentSelection.every(node => node.type === 'FRAME')) {
        const selectionInfos = currentSelection.map((node) => {
            node.exportAsync({ format: 'JPG' }).then((rendered) => {
                figma.ui.postMessage({ key: 'node-render-data-url', value: { nodeId: node.id, rendered } });
            });
            return {
                nodeId:              node.id,
                nodeName:            node.name,
                markerPlaceholderId: node.findOne(n => n.name === '#marker')?.id,
            }
        });
        figma.ui.postMessage({ key: 'valid-selection', value: selectionInfos });
    } else {
        figma.ui.postMessage({ key: 'invalid-selection' });
    }
}