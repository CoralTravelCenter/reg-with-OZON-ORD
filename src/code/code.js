import { figmaClientStorageKey } from "../commons";

figma.showUI(__html__, { width: 600, height: 600 });

figma.clientStorage.getAsync(figmaClientStorageKey).then((something) => {
    if (something) {
        figma.ui.postMessage({ key: 'sync-local-settings', value: something });
    }
});

figma.on('selectionchange', informUIAboutSelection);
informUIAboutSelection();

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