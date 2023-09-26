import { figmaClientStorageKey } from "../commons";
import { listenForAPIRequests } from "../call-api";

figma.showUI(__html__, { width: 600, height: 600 });

figma.clientStorage.getAsync(figmaClientStorageKey).then((something) => {
    if (something) {
        figma.ui.postMessage({ key: 'sync-local-settings', value: something });
    }
});

figma.on('selectionchange', informUIAboutSelection);
informUIAboutSelection();

figma.ui.onmessage = (msg) => {
    switch (msg.key) {
        case 'store-local-settings':
            figma.clientStorage.setAsync(figmaClientStorageKey, JSON.parse(msg.value)).then(() => {
                console.log('+++ store-local-settings: stored: %o', msg.value)
            });
            break;
    }
};

listenForAPIRequests();

//======================================================================================================================
function informUIAboutSelection() {
    if (figma.currentPage.selection.length === 1) {
        const selected = figma.currentPage.selection[0];
        if (selected.type === 'COMPONENT_SET') {
            figma.ui.postMessage({ key: 'valid-selection', value: selected.children });
        } else if (selected.type === 'COMPONENT') {
            figma.ui.postMessage({ key: 'valid-selection', value: [selected] });
        }
    } else {
        figma.ui.postMessage({ key: 'invalid-selection' });
    }
}